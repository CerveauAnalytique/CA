import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'shop_data.dart';

const countries = ['NL', 'BE', 'DE', 'FR', 'ES', 'PL', 'GB', 'US', 'AT', 'IT', 'IE', 'LU', 'DK', 'SE', 'NO', 'CH', 'PT', 'FI', 'CZ', 'CA', 'AU'];

/// The address fields of the website's AddressForm.
class AddressFields extends StatefulWidget {
  const AddressFields({super.key, required this.initial, required this.onChanged});
  final Address initial;
  final ValueChanged<Address> onChanged;
  @override
  State<AddressFields> createState() => _AddressFieldsState();
}

class _AddressFieldsState extends State<AddressFields> {
  late final _c = {
    for (final k in ['firstName', 'lastName', 'company', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'phone'])
      k: TextEditingController(text: {'firstName': widget.initial.firstName, 'lastName': widget.initial.lastName, 'company': widget.initial.company, 'addressLine1': widget.initial.addressLine1, 'addressLine2': widget.initial.addressLine2, 'city': widget.initial.city, 'state': widget.initial.state, 'postalCode': widget.initial.postalCode, 'phone': widget.initial.phone}[k] ?? ''),
  };
  late String _country = widget.initial.country;

  void _emit() => widget.onChanged(Address(id: widget.initial.id, firstName: _c['firstName']!.text, lastName: _c['lastName']!.text, company: _c['company']!.text, addressLine1: _c['addressLine1']!.text, addressLine2: _c['addressLine2']!.text, city: _c['city']!.text, state: _c['state']!.text, postalCode: _c['postalCode']!.text, country: _country, phone: _c['phone']!.text));

  Widget f(String key, String label, {bool half = false}) => SizedBox(width: half ? 250 : double.infinity, child: TextField(controller: _c[key], onChanged: (_) => _emit(), decoration: InputDecoration(labelText: label)));

  @override
  Widget build(BuildContext context) => Wrap(spacing: 12, runSpacing: 12, children: [
        f('firstName', '${context.t('First name')}*', half: true),
        f('lastName', '${context.t('Last name')}*', half: true),
        f('company', context.t('Company')),
        f('addressLine1', '${context.t('Address line 1')}*'),
        f('addressLine2', context.t('Address line 2')),
        f('city', '${context.t('City')}*', half: true),
        f('state', context.t('State'), half: true),
        f('postalCode', '${context.t('Postal code')}*', half: true),
        SizedBox(width: 250, child: DropdownButtonFormField<String>(initialValue: _country, items: [for (final c in countries) DropdownMenuItem(value: c, child: Text(c))], onChanged: (v) { setState(() => _country = v ?? _country); _emit(); }, decoration: InputDecoration(labelText: '${context.t('Country')}*'))),
        f('phone', context.t('Phone')),
      ]);
}

bool addressComplete(Address a) => (a.firstName ?? '').isNotEmpty && (a.lastName ?? '').isNotEmpty && (a.addressLine1 ?? '').isNotEmpty && (a.city ?? '').isNotEmpty && (a.postalCode ?? '').isNotEmpty;

final _savedAddressesProvider = FutureProvider.autoDispose<List<Address>>((ref) async => ref.watch(authProvider).user == null ? <Address>[] : ref.watch(shopRepoProvider).addresses());

class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key});
  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  late final TextEditingController _email = TextEditingController(text: ref.read(authProvider).user?.email ?? '');
  Address _ship = Address();
  Address _bill = Address();
  bool _same = true;
  bool _busy = false;
  String? _error;
  int _formKey = 0;

  bool _stripe = false;
  @override
  void initState() {
    super.initState();
    ref.read(shopRepoProvider).methods().then((m) { if (mounted) setState(() => _stripe = m.stripe); }).catchError((_) {});
  }

  Future<void> _pay({bool stripe = false}) async {
    final cart = ref.read(cartProvider).cart;
    if (cart == null || cart.items.isEmpty) return;
    final bill = _same ? _ship : _bill;
    if (!_email.text.contains('@')) return setState(() => _error = context.t('Email is required.'));
    if (!addressComplete(_ship) || !addressComplete(bill)) return setState(() => _error = context.t('Please fill in the required address fields.'));
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(shopRepoProvider);
      final url = stripe ? await repo.payWithStripe(cart: cart, email: _email.text.trim(), shipping: _ship, billing: bill, lang: ref.read(i18nProvider).lang) : await repo.payWithMollie(cart: cart, email: _email.text.trim(), shipping: _ship, billing: bill);
      await launchUrl(Uri.parse(url), webOnlyWindowName: '_self');
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider).cart;
    final saved = ref.watch(_savedAddressesProvider).value ?? const <Address>[];
    final c = context.ca;
    if (cart == null || cart.items.isEmpty) {
      return Container1280(padding: const EdgeInsets.all(24), child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(context.t('Your cart is empty.')), const SizedBox(height: 12), Lnk(to: '/shop', child: CaButton(context.t('Shop'), outlined: true, link: true))])));
    }
    final form = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(context.t('Contact'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 12),
      TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: '${context.t('Email')}*')),
      const SizedBox(height: 28),
      Text(context.t('Shipping address'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 12),
      if (saved.isNotEmpty) ...[
        DropdownButtonFormField<String>(hint: Text(context.t('Use a saved address')), items: [for (final a in saved) DropdownMenuItem(value: a.id, child: Text(a.oneLine, overflow: TextOverflow.ellipsis))], onChanged: (id) => setState(() { _ship = saved.firstWhere((a) => a.id == id); _formKey++; }), decoration: const InputDecoration()),
        const SizedBox(height: 12),
      ],
      AddressFields(key: ValueKey('ship$_formKey'), initial: _ship, onChanged: (a) => _ship = a),
      const SizedBox(height: 16),
      CheckboxListTile(contentPadding: EdgeInsets.zero, controlAffinity: ListTileControlAffinity.leading, value: _same, onChanged: (v) => setState(() => _same = v ?? true), title: Text(context.t('Billing address is the same as shipping'), style: const TextStyle(fontSize: 14))),
      if (!_same) ...[const SizedBox(height: 12), AddressFields(initial: _bill, onChanged: (a) => _bill = a)],
    ]);
    final summary = CaCard(title: context.t('Order summary'), child: Column(children: [
      for (final i in cart.items) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Expanded(child: Text('${i.quantity} × ${i.title}', style: const TextStyle(fontSize: 13))), Text(money((i.unitPrice ?? 0) * i.quantity, cart.currency), style: const TextStyle(fontSize: 13))])),
      const Divider(),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(context.t('Total'), style: TextStyle(color: c.muted)), Text(money(cart.subtotal, cart.currency), style: const TextStyle(fontWeight: FontWeight.w600))]),
      const SizedBox(height: 16),
      if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: const TextStyle(fontSize: 12, color: Brand.red))),
      SizedBox(width: double.infinity, child: Center(child: CaButton(context.t('Pay with iDEAL, Bancontact or card'), onPressed: _pay, busy: _busy))),
      if (_stripe) ...[const SizedBox(height: 8), SizedBox(width: double.infinity, child: Center(child: CaButton(context.t('Pay by card (Stripe)'), outlined: true, onPressed: _busy ? null : () => _pay(stripe: true))))],
      const SizedBox(height: 8),
      Muted(context.t('You pay on a secure page of Mollie or Stripe.'), size: 11),
    ]));
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 48 : 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(context.t('Checkout'), style: TextStyle(fontSize: (context.width * .04).clamp(28.0, 40.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
        const SizedBox(height: 24),
        context.width >= 900 ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(flex: 2, child: form), const SizedBox(width: 32), SizedBox(width: 340, child: summary)]) : Column(children: [form, const SizedBox(height: 24), summary]),
      ]),
    );
  }
}

/// Where Mollie sends the shopper back: checks the payment and shows the order.
class ConfirmOrderPage extends ConsumerStatefulWidget {
  const ConfirmOrderPage({super.key});
  @override
  ConsumerState<ConfirmOrderPage> createState() => _ConfirmOrderPageState();
}

class _ConfirmOrderPageState extends ConsumerState<ConfirmOrderPage> {
  String? _failed;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _confirm());
  }

  Future<void> _confirm() async {
    final q = GoRouterState.of(context).uri.queryParameters;
    final stripe = q['provider'] == 'stripe';
    final payment = stripe ? q['paymentIntent'] : q['paymentId'];
    if ((q['provider'] != 'mollie' && !stripe) || payment == null) return context.goL('/');
    final ctl = ref.read(cartProvider);
    if (ctl.cart == null) await ctl.load();
    final cart = ctl.cart;
    if (cart == null) return setState(() => _failed = 'We could not find your cart on this device.');
    try {
      final repo = ref.read(shopRepoProvider);
      final r = stripe ? await repo.confirmStripe(cart: cart, paymentIntent: payment, email: q['email']) : await repo.confirmMollie(cart: cart, paymentId: payment, email: q['email']);
      await ctl.finished();
      if (!mounted) return;
      final qs = [if (q['email'] != null) 'email=${Uri.encodeQueryComponent(q['email']!)}', if (r.accessToken != null) 'accessToken=${r.accessToken}'].join('&');
      context.goL('/orders/${r.orderId}${qs.isEmpty ? '' : '?$qs'}');
    } catch (e) {
      if (mounted) setState(() => _failed = context.t('Your payment was not completed.'));
    }
  }

  @override
  Widget build(BuildContext context) => Container1280(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 96),
        child: Center(
          child: _failed != null
              ? Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(context.t('Payment not completed'), style: const TextStyle(fontSize: 24)),
                  const SizedBox(height: 12),
                  Muted('$_failed ${context.t('You have not been charged for an unfinished payment.')}', center: true),
                  const SizedBox(height: 16),
                  Lnk(to: '/checkout', child: Text(context.t('Back to checkout'), style: const TextStyle(decoration: TextDecoration.underline))),
                ])
              : Column(mainAxisSize: MainAxisSize.min, children: [Text(context.t('Confirming Order'), style: const TextStyle(fontSize: 24)), const SizedBox(height: 16), const CircularProgressIndicator(strokeWidth: 2)]),
        ),
      );
}

// ---- addresses (account) -------------------------------------------------------------------------------------------

class AddressesPage extends ConsumerStatefulWidget {
  const AddressesPage({super.key});
  @override
  ConsumerState<AddressesPage> createState() => _AddressesPageState();
}

class _AddressesPageState extends ConsumerState<AddressesPage> {
  Address? _editing;
  int _key = 0;
  String? _error;

  Future<void> _save() async {
    final a = _editing!;
    if (!addressComplete(a)) return setState(() => _error = context.t('Please fill in the required address fields.'));
    try {
      await ref.read(shopRepoProvider).saveAddress(a, ref.read(authProvider).user!.id);
      ref.invalidate(_savedAddressesProvider);
      setState(() { _editing = null; _error = null; });
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = ref.watch(_savedAddressesProvider);
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 48 : 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(context.t('Addresses'), style: TextStyle(fontSize: (context.width * .04).clamp(28.0, 40.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
        const SizedBox(height: 24),
        if (_editing != null)
          CaCard(title: context.t(_editing!.id == null ? 'Add an address' : 'Edit address'), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            AddressFields(key: ValueKey(_key), initial: _editing!, onChanged: (a) => _editing = a),
            if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Brand.red, fontSize: 12))),
            const SizedBox(height: 16),
            Row(children: [CaButton(context.t('Save'), onPressed: _save), const SizedBox(width: 8), CaButton(context.t('Cancel'), outlined: true, onPressed: () => setState(() { _editing = null; _error = null; }))]),
          ]))
        else ...[
          CaButton(context.t('Add an address'), icon: Icons.add, onPressed: () => setState(() { _editing = Address(); _key++; })),
          const SizedBox(height: 16),
          list.when(
            loading: () => const StateBox.loading(),
            error: (e, _) => StateBox.error('$e'),
            data: (l) => l.isEmpty
                ? StateBox.empty(context.t('You have no saved addresses.'))
                : Column(children: [for (final a in l) Padding(padding: const EdgeInsets.only(bottom: 12), child: CaCard(child: Row(children: [Expanded(child: Text(a.oneLine)), TextButton(onPressed: () => setState(() { _editing = a; _key++; }), child: Text(context.t('Edit'))), TextButton(onPressed: () async { await ref.read(shopRepoProvider).deleteAddress(a.id!); ref.invalidate(_savedAddressesProvider); }, child: Text(context.t('Delete')))])))]),
          ),
        ],
      ]),
    );
  }
}
