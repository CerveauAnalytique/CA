import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../app/configuration/env.dart';
import '../../core/api/api_client.dart';
import '../../core/errors/app_exception.dart';
import '../../core/providers.dart';

// ---- models (Payload ecommerce collections) -----------------------------------------------------------------

String money(num? cents, [String currency = 'USD']) {
  if (cents == null) return '';
  final sym = {'USD': r'$', 'EUR': '€', 'GBP': '£'}[currency] ?? '$currency ';
  final v = (cents / 100).toStringAsFixed(2);
  final parts = v.split('.');
  final whole = parts[0].replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},');
  return '$sym$whole.${parts[1]}';
}

String? mediaUrl(dynamic media) {
  if (media is Map && media['url'] is String) {
    final u = media['url'] as String;
    return u.startsWith('http') ? u : '${Env.shown}$u';
  }
  return null;
}

class VariantOption {
  VariantOption(this.id, this.label, this.typeId, this.typeLabel);
  final String id, label, typeId, typeLabel;
}

class Variant {
  Variant({required this.id, required this.price, required this.inventory, required this.options});
  final String id;
  final int? price, inventory;
  final List<VariantOption> options;
}

class Product {
  Product({required this.id, required this.slug, required this.title, this.price, this.inventory, this.images = const [], this.description = '', this.enableVariants = false, this.categories = const [], this.variants = const []});
  final String id, slug, title, description;
  final int? price, inventory;
  final List<String> images, categories;
  final bool enableVariants;
  final List<Variant> variants;

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: '${j['id']}',
        slug: '${j['slug']}',
        title: '${j['title']}',
        price: (j['priceInUSD'] as num?)?.toInt(),
        inventory: (j['inventory'] as num?)?.toInt(),
        images: ((j['gallery'] ?? const []) as List).map((g) => mediaUrl(g is Map ? g['image'] : null)).whereType<String>().toList(),
        description: richText(j['description'] ?? j['meta']?['description']),
        enableVariants: j['enableVariants'] == true,
        categories: ((j['categories'] ?? const []) as List).map((c) => c is Map ? '${c['title'] ?? c['id']}' : '$c').toList(),
        variants: _variants(j['variants'], _typeLabels(j['variantTypes'])),
      );

  static Map<String, String> _typeLabels(dynamic t) => {for (final x in (t is List ? t : const []).whereType<Map>()) '${x['id']}': '${x['label'] ?? x['name']}'};

  static List<Variant> _variants(dynamic v, [Map<String, String> labels = const {}]) {
    final docs = v is Map ? v['docs'] : null;
    if (docs is! List) return const [];
    return docs.whereType<Map>().map((d) => Variant(
          id: '${d['id']}',
          price: (d['priceInUSD'] as num?)?.toInt(),
          inventory: (d['inventory'] as num?)?.toInt(),
          options: ((d['options'] ?? const []) as List).whereType<Map>().map((o) {
            final t = o['variantType'];
            final tid = t is Map ? '${t['id']}' : '$t';
            return VariantOption('${o['id']}', '${o['label']}', tid, t is Map ? '${t['label'] ?? t['name']}' : (labels[tid] ?? 'Option'));
          }).toList(),
        )).toList();
  }
}

/// Plain text of a Lexical rich text value (or a string).
String richText(dynamic v) {
  if (v == null) return '';
  if (v is String) return v;
  final buf = StringBuffer();
  void walk(dynamic n) {
    if (n is Map) {
      if (n['text'] is String) buf.write(n['text']);
      final c = n['children'];
      if (c is List) {
        for (final x in c) {
          walk(x);
        }
        if (n['type'] == 'paragraph' || n['type'] == 'heading' || n['type'] == 'listitem') buf.write('\n');
      }
      if (n['root'] != null) walk(n['root']);
    }
  }
  walk(v);
  return buf.toString().trim();
}

class CartItem {
  CartItem({required this.id, required this.product, this.variant, required this.quantity});
  final String id;
  final Product product;
  final Variant? variant;
  final int quantity;
  int? get unitPrice => variant?.price ?? product.price;
  String get title => variant == null || variant!.options.isEmpty ? product.title : '${product.title} · ${variant!.options.map((o) => o.label).join(', ')}';
}

class Cart {
  Cart({required this.id, this.secret, this.items = const [], this.subtotal = 0, this.currency = 'USD'});
  final String id;
  final String? secret;
  final List<CartItem> items;
  final int subtotal;
  final String currency;
  int get count => items.fold(0, (a, b) => a + b.quantity);
}

class Address {
  Address({this.id, this.title, this.firstName, this.lastName, this.company, this.addressLine1, this.addressLine2, this.city, this.state, this.postalCode, this.country = 'NL', this.phone});
  final String? id, title, firstName, lastName, company, addressLine1, addressLine2, city, state, postalCode, phone;
  final String country;

  factory Address.fromJson(Map<String, dynamic> j) => Address(id: j['id']?.toString(), title: j['title'], firstName: j['firstName'], lastName: j['lastName'], company: j['company'], addressLine1: j['addressLine1'], addressLine2: j['addressLine2'], city: j['city'], state: j['state'], postalCode: j['postalCode'], country: (j['country'] ?? 'NL') as String, phone: j['phone']);
  Map<String, dynamic> toJson() => {'title': title, 'firstName': firstName, 'lastName': lastName, 'company': company, 'addressLine1': addressLine1, 'addressLine2': addressLine2, 'city': city, 'state': state, 'postalCode': postalCode, 'country': country, 'phone': phone}..removeWhere((_, v) => v == null || v == '');
  String get oneLine => [ '${firstName ?? ''} ${lastName ?? ''}'.trim(), addressLine1, '${postalCode ?? ''} ${city ?? ''}'.trim(), country].where((e) => e != null && '$e'.isNotEmpty).join(', ');
}

class OrderLine {
  OrderLine(this.title, this.quantity, this.price);
  final String title;
  final int quantity;
  final int? price;
}

class Order {
  Order({required this.id, required this.status, required this.amount, required this.currency, required this.createdAt, this.email, this.lines = const [], this.shipping});
  final String id, status, currency, createdAt;
  final int amount;
  final String? email;
  final List<OrderLine> lines;
  final Address? shipping;

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: '${j['id']}',
        status: '${j['status'] ?? 'processing'}',
        amount: (j['amount'] as num?)?.toInt() ?? 0,
        currency: '${j['currency'] ?? 'USD'}',
        createdAt: '${j['createdAt'] ?? ''}',
        email: j['customerEmail'] as String?,
        shipping: j['shippingAddress'] is Map ? Address.fromJson(Map<String, dynamic>.from(j['shippingAddress'] as Map)) : null,
        lines: ((j['items'] ?? const []) as List).whereType<Map>().map((i) {
          final p = i['product'];
          final v = i['variant'];
          final title = p is Map ? '${p['title']}' : 'Product';
          final opts = v is Map ? ((v['options'] ?? const []) as List).whereType<Map>().map((o) => '${o['label']}').join(', ') : '';
          return OrderLine(opts.isEmpty ? title : '$title · $opts', (i['quantity'] as num?)?.toInt() ?? 1, (v is Map ? v['priceInUSD'] : (p is Map ? p['priceInUSD'] : null)) as int?);
        }).toList(),
      );
}

// ---- repository ---------------------------------------------------------------------------------------------------

class ShopRepository {
  ShopRepository(this.api);
  final ApiClient api;

  Map<String, dynamic> _m(dynamic v) => Map<String, dynamic>.from(v as Map);

  Future<List<Product>> products({String q = '', String? category, String sort = '-createdAt'}) async {
    final query = <String, dynamic>{'limit': 60, 'depth': 2, 'sort': sort, 'where[_status][equals]': 'published'};
    if (q.isNotEmpty) {
      query['where[or][0][title][like]'] = q;
    }
    if (category != null) query['where[categories][equals]'] = category;
    final res = await api.get('/api/products', query: query);
    return (res['docs'] as List).map((d) => Product.fromJson(_m(d))).toList();
  }

  Future<Product?> product(String slug) async {
    final res = await api.get('/api/products', query: {'limit': 1, 'depth': 3, 'where[slug][equals]': slug, 'where[_status][equals]': 'published'});
    final docs = res['docs'] as List;
    return docs.isEmpty ? null : Product.fromJson(_m(docs.first));
  }

  Future<List<(String, String)>> categories() async {
    final res = await api.get('/api/categories', query: {'limit': 50, 'depth': 0});
    return (res['docs'] as List).map((c) => ('${c['id']}', '${c['title']}')).toList();
  }

  static const _cartQuery = {'depth': 3};

  Cart _cart(Map<String, dynamic> j, {String? secret}) => Cart(
        id: '${j['id']}',
        secret: secret ?? j['secret'] as String?,
        subtotal: (j['subtotal'] as num?)?.toInt() ?? 0,
        currency: '${j['currency'] ?? 'USD'}',
        items: ((j['items'] ?? const []) as List).whereType<Map>().where((i) => i['product'] is Map).map((i) => CartItem(
              id: '${i['id']}',
              product: Product.fromJson(_m(i['product'])),
              variant: i['variant'] is Map ? Product._variants({'docs': [i['variant']]}).first : null,
              quantity: (i['quantity'] as num?)?.toInt() ?? 1,
            )).toList(),
      );

  Future<Cart> getCart(String id, String? secret) async => _cart(_m(await api.get('/api/carts/$id', query: {..._cartQuery, if (secret != null) 'secret': secret})), secret: secret);

  Future<Cart> createCart(String productId, String? variantId, int qty, {String? customer}) async {
    final res = await api.post('/api/carts', body: {'currency': 'USD', 'items': [{'product': int.parse(productId), if (variantId != null) 'variant': int.parse(variantId), 'quantity': qty}], if (customer != null) 'customer': int.parse(customer)});
    final doc = _m(res['doc']);
    return getCart('${doc['id']}', doc['secret'] as String?);
  }

  Future<void> addItem(String cartId, String? secret, String productId, String? variantId, int qty) async {
    await api.post('/api/carts/$cartId/add-item', body: {'item': {'product': int.parse(productId), if (variantId != null) 'variant': int.parse(variantId)}, 'quantity': qty, 'secret': secret});
  }

  Future<void> setQuantity(String cartId, String? secret, String itemId, int qty) async {
    if (qty <= 0) {
      await api.post('/api/carts/$cartId/remove-item', body: {'itemID': itemId, 'secret': secret});
    } else {
      await api.post('/api/carts/$cartId/update-item', body: {'itemID': itemId, 'quantity': qty, 'secret': secret});
    }
  }

  Future<void> clear(String cartId, String? secret) async => api.post('/api/carts/$cartId/clear', body: {'secret': secret});

  /// Starts a Mollie payment and returns the page where the shopper pays.
  Future<String> payWithMollie({required Cart cart, required String email, required Address shipping, required Address billing}) async {
    final res = await api.post('/api/payments/mollie/initiate', body: {'cartID': int.parse(cart.id), 'currency': cart.currency, 'secret': cart.secret, 'customerEmail': email, 'billingAddress': billing.toJson(), 'shippingAddress': shipping.toJson()});
    final url = res['checkoutUrl'] as String?;
    if (url == null || url.isEmpty) throw AppException('Mollie did not return a payment page.');
    return url;
  }

  /// Which payment methods the shop has switched on.
  Future<({bool mollie, bool stripe})> methods() async {
    final r = await api.get('/api/ca/shop');
    return (mollie: r['mollie'] == true, stripe: r['stripe'] == true);
  }

  /// Starts a Stripe card payment and returns the card page (Stripe's own form).
  Future<String> payWithStripe({required Cart cart, required String email, required Address shipping, required Address billing, required String lang}) async {
    final res = await api.post('/api/payments/stripe/initiate', body: {'cartID': int.parse(cart.id), 'currency': cart.currency, 'secret': cart.secret, 'customerEmail': email, 'billingAddress': billing.toJson(), 'shippingAddress': shipping.toJson()});
    final cs = res['clientSecret'] as String?;
    if (cs == null || cs.isEmpty) throw AppException('Stripe did not return a payment.');
    return '${Env.shown}/api/ca/stripe/pay?cs=${Uri.encodeQueryComponent(cs)}&email=${Uri.encodeQueryComponent(email)}&lang=$lang';
  }

  Future<({String orderId, String? accessToken})> confirmStripe({required Cart cart, required String paymentIntent, String? email}) async {
    final res = await api.post('/api/payments/stripe/confirm-order', body: {'cartID': int.parse(cart.id), 'currency': cart.currency, 'secret': cart.secret, 'paymentIntentID': paymentIntent, if (email != null) 'customerEmail': email});
    return (orderId: '${res['orderID']}', accessToken: res['accessToken'] as String?);
  }

  Future<({String orderId, String? accessToken})> confirmMollie({required Cart cart, required String paymentId, String? email}) async {
    final res = await api.post('/api/payments/mollie/confirm-order', body: {'cartID': int.parse(cart.id), 'currency': cart.currency, 'secret': cart.secret, 'paymentID': paymentId, if (email != null) 'customerEmail': email});
    return (orderId: '${res['orderID']}', accessToken: res['accessToken'] as String?);
  }

  Future<List<Order>> myOrders() async => ((await api.get('/api/orders', query: {'limit': 50, 'depth': 2, 'sort': '-createdAt'}))['docs'] as List).map((d) => Order.fromJson(_m(d))).toList();
  Future<Order> myOrder(String id) async => Order.fromJson(_m(await api.get('/api/orders/$id', query: {'depth': 2})));
  Future<Order> guestOrder(String id, String token, String? email) async => Order.fromJson(_m(await api.get('/api/ca/orders/guest', query: {'id': id, 'accessToken': token, if (email != null) 'email': email})));
  Future<void> findOrder(String email, String orderId) => api.post('/api/ca/orders/find', body: {'email': email, 'orderID': orderId});

  Future<List<Address>> addresses() async => ((await api.get('/api/addresses', query: {'limit': 50, 'depth': 0}))['docs'] as List).map((d) => Address.fromJson(_m(d))).toList();
  Future<void> saveAddress(Address a, String customerId) async {
    if (a.id == null) {
      await api.post('/api/addresses', body: {...a.toJson(), 'customer': int.parse(customerId)});
    } else {
      await api.patch('/api/addresses/${a.id}', body: a.toJson());
    }
  }
  Future<void> deleteAddress(String id) => api.delete('/api/addresses/$id');
}

final shopRepoProvider = Provider((ref) => ShopRepository(ref.watch(apiClientProvider)));

/// The shopping cart. Kept on the server (guest carts have a secret); only the id and secret are stored on the device.
class CartController extends ChangeNotifier {
  CartController(this.repo);
  final ShopRepository repo;
  Cart? cart;
  bool busy = false;
  String? error;

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    final id = p.getString('ca7_cart_id');
    if (id == null) return;
    try {
      cart = await repo.getCart(id, p.getString('ca7_cart_secret'));
    } catch (_) {
      await _forget();
    }
    notifyListeners();
  }

  Future<void> _remember(Cart c) async {
    final p = await SharedPreferences.getInstance();
    await p.setString('ca7_cart_id', c.id);
    if (c.secret != null) await p.setString('ca7_cart_secret', c.secret!);
  }

  Future<void> _forget() async {
    final p = await SharedPreferences.getInstance();
    await p.remove('ca7_cart_id');
    await p.remove('ca7_cart_secret');
    cart = null;
  }

  Future<void> _run(Future<void> Function() fn) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      await fn();
    } catch (e) {
      error = e.toString();
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> add(Product p, Variant? v, {int qty = 1, String? customerId}) => _run(() async {
        final c = cart;
        if (c == null) {
          cart = await repo.createCart(p.id, v?.id, qty, customer: customerId);
          await _remember(cart!);
        } else {
          await repo.addItem(c.id, c.secret, p.id, v?.id, qty);
          cart = await repo.getCart(c.id, c.secret);
        }
      });

  Future<void> setQuantity(CartItem i, int qty) => _run(() async {
        final c = cart!;
        await repo.setQuantity(c.id, c.secret, i.id, qty);
        cart = await repo.getCart(c.id, c.secret);
      });

  /// After a paid order the cart is empty on the server; forget it here too.
  Future<void> finished() async {
    await _forget();
    notifyListeners();
  }
}

final cartProvider = ChangeNotifierProvider<CartController>((ref) => CartController(ref.watch(shopRepoProvider)));
