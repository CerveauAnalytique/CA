import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'shop_data.dart';

Widget _page(BuildContext context, List<Widget> children) => Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 48 : 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );

TextStyle _h1(BuildContext c) => TextStyle(fontSize: (c.width * .04).clamp(28.0, 40.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1);

class ProductImage extends StatelessWidget {
  const ProductImage(this.url, {super.key, this.size});
  final String? url;
  final double? size;
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: context.ca.card, borderRadius: BorderRadius.circular(12)),
        clipBehavior: Clip.antiAlias,
        child: url == null ? Icon(Icons.inventory_2_outlined, color: context.ca.faint, size: 32) : Image.network(url!, fit: BoxFit.cover, errorBuilder: (_, _, _) => Icon(Icons.image_not_supported_outlined, color: context.ca.faint)),
      );
}

// ---- shop list ---------------------------------------------------------------------------------------------------

final _categoriesProvider = FutureProvider.autoDispose((ref) => ref.watch(shopRepoProvider).categories());
final _productsProvider = FutureProvider.autoDispose.family<List<Product>, ({String q, String? cat, String sort})>((ref, a) => ref.watch(shopRepoProvider).products(q: a.q, category: a.cat, sort: a.sort));

class ShopPage extends ConsumerStatefulWidget {
  const ShopPage({super.key});
  @override
  ConsumerState<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends ConsumerState<ShopPage> {
  final _q = TextEditingController();
  String _query = '', _sort = '-createdAt';
  String? _cat;

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(_categoriesProvider).value ?? const <(String, String)>[];
    final products = ref.watch(_productsProvider((q: _query, cat: _cat, sort: _sort)));
    final cols = context.width >= Bp.lg ? 4 : (context.width >= Bp.sm ? 3 : 2);
    return _page(context, [
      Text(context.t('Shop'), style: _h1(context)),
      const SizedBox(height: 8),
      Muted(context.t('Apps and tools for CA7'), size: 15),
      const SizedBox(height: 24),
      Wrap(spacing: 12, runSpacing: 12, crossAxisAlignment: WrapCrossAlignment.center, children: [
        SizedBox(width: 320, child: TextField(controller: _q, onSubmitted: (v) => setState(() => _query = v.trim()), decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 16), hintText: context.t('Search…')))),
        DropdownButton<String>(value: _sort, underline: const SizedBox(), items: const [DropdownMenuItem(value: '-createdAt', child: Text('Latest')), DropdownMenuItem(value: 'priceInUSD', child: Text('Price: low to high')), DropdownMenuItem(value: '-priceInUSD', child: Text('Price: high to low'))], onChanged: (v) => setState(() => _sort = v ?? _sort)),
      ]),
      if (cats.isNotEmpty) ...[
        const SizedBox(height: 16),
        Wrap(spacing: 8, runSpacing: 8, children: [
          ChoiceChip(label: Text(context.t('All')), selected: _cat == null, onSelected: (_) => setState(() => _cat = null), shape: const StadiumBorder(), showCheckmark: false),
          for (final c in cats) ChoiceChip(label: Text(c.$2), selected: _cat == c.$1, onSelected: (_) => setState(() => _cat = c.$1), shape: const StadiumBorder(), showCheckmark: false),
        ]),
      ],
      const SizedBox(height: 24),
      products.when(
        loading: () => const StateBox.loading(),
        error: (e, _) => StateBox.error('$e'),
        data: (list) => list.isEmpty
            ? StateBox.empty(context.t('No products found.'))
            : LayoutBuilder(builder: (_, box) {
                final w = (box.maxWidth - 16 * (cols - 1)) / cols;
                return Wrap(spacing: 16, runSpacing: 24, children: [for (final p in list) SizedBox(width: w, child: _ProductCard(p))]);
              }),
      ),
    ]);
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard(this.p);
  final Product p;
  @override
  Widget build(BuildContext context) => Lnk(
        to: '/products/${p.slug}',
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(aspectRatio: 1, child: ProductImage(p.images.isEmpty ? null : p.images.first)),
          const SizedBox(height: 10),
          Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(p.enableVariants && p.variants.isNotEmpty ? '${context.t('from')} ${money(p.variants.map((v) => v.price ?? 0).reduce((a, b) => a < b ? a : b))}' : money(p.price), style: TextStyle(fontSize: 13, color: context.ca.muted)),
        ]),
      );
}

// ---- product -----------------------------------------------------------------------------------------------------

final _productProvider = FutureProvider.autoDispose.family<Product?, String>((ref, slug) => ref.watch(shopRepoProvider).product(slug));

class ProductPage extends ConsumerStatefulWidget {
  const ProductPage({super.key, required this.slug});
  final String slug;
  @override
  ConsumerState<ProductPage> createState() => _ProductPageState();
}

class _ProductPageState extends ConsumerState<ProductPage> {
  final _chosen = <String, String>{}; // type id -> option id
  int _image = 0;

  Variant? _match(Product p) {
    if (!p.enableVariants || p.variants.isEmpty) return null;
    final types = {for (final v in p.variants) for (final o in v.options) o.typeId};
    if (_chosen.length < types.length) return null;
    for (final v in p.variants) {
      if (v.options.every((o) => _chosen[o.typeId] == o.id)) return v;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final async = ref.watch(_productProvider(widget.slug));
    final cart = ref.watch(cartProvider);
    return _page(context, [
      InkWell(onTap: () => context.goL('/shop'), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.arrow_back, size: 14, color: c.muted), const SizedBox(width: 6), Text(context.t('Shop'), style: TextStyle(fontSize: 13, color: c.muted))])),
      const SizedBox(height: 24),
      async.when(
        loading: () => const StateBox.loading(),
        error: (e, _) => StateBox.error('$e'),
        data: (p) {
          if (p == null) return StateBox.empty(context.t('No products found.'));
          final v = _match(p);
          final needsChoice = p.enableVariants && p.variants.isNotEmpty;
          final stock = needsChoice ? v?.inventory : p.inventory;
          final price = v?.price ?? p.price;
          final types = <String, (String, List<VariantOption>)>{};
          for (final vr in p.variants) {
            for (final o in vr.options) {
              final e = types.putIfAbsent(o.typeId, () => (o.typeLabel, []));
              if (!e.$2.any((x) => x.id == o.id)) e.$2.add(o);
            }
          }
          final gallery = Column(children: [
            AspectRatio(aspectRatio: 1, child: ProductImage(p.images.isEmpty ? null : p.images[_image.clamp(0, p.images.length - 1)])),
            if (p.images.length > 1) Padding(padding: const EdgeInsets.only(top: 12), child: Wrap(spacing: 8, children: [for (var i = 0; i < p.images.length; i++) GestureDetector(onTap: () => setState(() => _image = i), child: ProductImage(p.images[i], size: 64))])),
          ]);
          final info = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.title, style: _h1(context)),
            const SizedBox(height: 8),
            Text(money(price), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w500)),
            if (p.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 20), child: Text(p.description, style: TextStyle(fontSize: 15, height: 1.6, color: c.muted))),
            for (final t in types.entries) ...[
              const SizedBox(height: 20),
              Text(t.value.$1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final o in t.value.$2) ChoiceChip(label: Text(o.label), selected: _chosen[t.key] == o.id, onSelected: (_) => setState(() => _chosen[t.key] = o.id), shape: const StadiumBorder(), showCheckmark: false)]),
            ],
            const SizedBox(height: 24),
            if (stock != null && stock <= 0) Text(context.t('Out of stock'), style: const TextStyle(color: Brand.red)),
            CaButton(context.t(needsChoice && v == null ? 'Select options' : 'Add to cart'), busy: cart.busy, onPressed: (needsChoice && v == null) || (stock != null && stock <= 0) ? null : () async {
              final user = ref.read(authProvider).user;
              await ref.read(cartProvider).add(p, v, customerId: user?.id);
              if (context.mounted) context.goL('/cart');
            }),
            if (cart.error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(cart.error!, style: const TextStyle(fontSize: 12, color: Brand.red))),
          ]);
          return context.isDesktop ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: gallery), const SizedBox(width: 48), Expanded(child: info)]) : Column(children: [gallery, const SizedBox(height: 24), info]);
        },
      ),
    ]);
  }
}

// ---- cart --------------------------------------------------------------------------------------------------------

class CartPage extends ConsumerWidget {
  const CartPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ctl = ref.watch(cartProvider);
    final cart = ctl.cart;
    final c = context.ca;
    return _page(context, [
      Text(context.t('Cart'), style: _h1(context)),
      const SizedBox(height: 24),
      if (cart == null || cart.items.isEmpty)
        CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(context.t('Your cart is empty.')), const SizedBox(height: 12), Lnk(to: '/shop', child: CaButton(context.t('Shop'), outlined: true, link: true))]))
      else
        LayoutBuilder(builder: (_, box) {
          final list = Column(children: [
            for (final i in cart.items)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: CaCard(child: Row(children: [
                  ProductImage(i.product.images.isEmpty ? null : i.product.images.first, size: 72),
                  const SizedBox(width: 16),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(i.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)), const SizedBox(height: 4), Text(money(i.unitPrice, cart.currency), style: TextStyle(fontSize: 13, color: c.muted))])),
                  IconButton(tooltip: '−', onPressed: ctl.busy ? null : () => ctl.setQuantity(i, i.quantity - 1), icon: const Icon(Icons.remove, size: 16)),
                  Text('${i.quantity}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  IconButton(tooltip: '+', onPressed: ctl.busy ? null : () => ctl.setQuantity(i, i.quantity + 1), icon: const Icon(Icons.add, size: 16)),
                  IconButton(tooltip: context.t('Remove'), onPressed: ctl.busy ? null : () => ctl.setQuantity(i, 0), icon: const Icon(Icons.delete_outline, size: 18)),
                ])),
              ),
          ]);
          final summary = CaCard(title: context.t('Order summary'), child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(context.t('Subtotal'), style: TextStyle(color: c.muted)), Text(money(cart.subtotal, cart.currency), style: const TextStyle(fontWeight: FontWeight.w600))]),
            const SizedBox(height: 16),
            Lnk(to: '/checkout', child: SizedBox(width: double.infinity, child: Center(child: CaButton(context.t('Checkout'), link: true)))),
          ]));
          return box.maxWidth >= 800 ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(flex: 2, child: list), const SizedBox(width: 24), SizedBox(width: 320, child: summary)]) : Column(children: [list, summary]);
        }),
    ]);
  }
}

// ---- find order ----------------------------------------------------------------------------------------------------

class FindOrderPage extends ConsumerStatefulWidget {
  const FindOrderPage({super.key});
  @override
  ConsumerState<FindOrderPage> createState() => _FindOrderPageState();
}

class _FindOrderPageState extends ConsumerState<FindOrderPage> {
  final _email = TextEditingController(), _order = TextEditingController();
  bool _busy = false, _sent = false;
  String? _error;

  Future<void> _go() async {
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(shopRepoProvider).findOrder(_email.text.trim(), _order.text.trim());
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => _page(context, [
        Text(context.t('Find my order'), style: _h1(context)),
        const SizedBox(height: 8),
        Muted(context.t('Enter your email and order number. If they match, we send you a link to your order.'), size: 15),
        const SizedBox(height: 24),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 520), child: _sent
            ? CaCard(child: Text(context.t('If an order matches, a link is on its way to your email.')))
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: const TextStyle(color: Brand.red, fontSize: 13))),
                CaField(controller: _email, label: context.t('Email'), keyboard: TextInputType.emailAddress),
                const SizedBox(height: 16),
                CaField(controller: _order, label: context.t('Order number')),
                const SizedBox(height: 20),
                CaButton(context.t('Find my order'), onPressed: _go, busy: _busy),
              ])),
      ]);
}

// ---- orders --------------------------------------------------------------------------------------------------------

final _ordersProvider = FutureProvider.autoDispose((ref) => ref.watch(shopRepoProvider).myOrders());

class OrdersPage extends ConsumerWidget {
  const OrdersPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    return _page(context, [
      Text(context.t('Orders'), style: _h1(context)),
      const SizedBox(height: 24),
      if (user == null)
        CaCard(child: Wrap(children: [Text('${context.t('Log in to see your orders.')} '), Lnk(to: '/login?redirect=%2Forders', child: Text(context.t('Log in'), style: const TextStyle(decoration: TextDecoration.underline))), const Text(' · '), Lnk(to: '/find-order', child: Text(context.t('Find my order'), style: const TextStyle(decoration: TextDecoration.underline)))]))
      else
        ref.watch(_ordersProvider).when(
              loading: () => const StateBox.loading(),
              error: (e, _) => StateBox.error('$e'),
              data: (list) => list.isEmpty
                  ? StateBox.empty(context.t('You have no orders yet.'))
                  : Column(children: [for (final o in list) Padding(padding: const EdgeInsets.only(bottom: 12), child: Lnk(to: '/orders/${o.id}', child: CaCard(child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('#${o.id}', style: const TextStyle(fontWeight: FontWeight.w600)), Text(o.createdAt.length >= 10 ? o.createdAt.substring(0, 10) : '', style: TextStyle(fontSize: 12, color: context.ca.muted))]), Column(crossAxisAlignment: CrossAxisAlignment.end, children: [Text(money(o.amount, o.currency), style: const TextStyle(fontWeight: FontWeight.w600)), Text(o.status, style: TextStyle(fontSize: 12, color: context.ca.muted))])]))))]),
            ),
    ]);
  }
}

class OrderPage extends ConsumerWidget {
  const OrderPage({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final q = GoRouterState.of(context).uri.queryParameters;
    final repo = ref.watch(shopRepoProvider);
    final user = ref.watch(authProvider).user;
    final future = user != null ? repo.myOrder(id) : (q['accessToken'] != null ? repo.guestOrder(id, q['accessToken']!, q['email']) : Future<Order>.error(Exception('Not found')));
    return _page(context, [
      Text('${context.t('Order')} #$id', style: _h1(context)),
      const SizedBox(height: 24),
      FutureBuilder<Order>(
        future: future,
        builder: (_, s) {
          if (s.connectionState != ConnectionState.done) return const StateBox.loading();
          if (s.hasError) return StateBox.empty(context.t('We could not find this order.'));
          final o = s.data!;
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            CaCard(title: o.status, child: Column(children: [
              for (final l in o.lines) Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Expanded(child: Text('${l.quantity} × ${l.title}')), Text(money(l.price == null ? null : l.price! * l.quantity, o.currency))])),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(context.t('Total')), Text(money(o.amount, o.currency), style: const TextStyle(fontWeight: FontWeight.w600))]),
            ])),
            if (o.shipping != null) Padding(padding: const EdgeInsets.only(top: 16), child: CaCard(title: context.t('Shipping address'), child: Text(o.shipping!.oneLine))),
          ]);
        },
      ),
    ]);
  }
}
