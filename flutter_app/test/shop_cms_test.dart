import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ca7_app/app/theme/theme.dart';
import 'package:ca7_app/core/api/api_client.dart';
import 'package:ca7_app/core/i18n/i18n.dart';
import 'package:ca7_app/features/content/cms.dart';
import 'package:ca7_app/features/shop/shop_data.dart';

void main() {
  test('money formats cents like the website', () {
    expect(money(4900), r'$49.00');
    expect(money(123456, 'EUR'), '€1,234.56');
    expect(money(null), '');
  });

  test('a product with variants picks the labels of its variant types', () {
    final p = Product.fromJson({
      'id': 3, 'slug': 'hub', 'title': 'Hub', 'priceInUSD': 9900, 'enableVariants': true,
      'variantTypes': [{'id': 1, 'label': 'Size', 'name': 'size'}],
      'variants': {'docs': [
        {'id': 1, 'priceInUSD': 9900, 'inventory': 3, 'options': [{'id': 1, 'label': 'Small', 'variantType': 1}]},
        {'id': 2, 'priceInUSD': 14900, 'inventory': 0, 'options': [{'id': 2, 'label': 'Large', 'variantType': 1}]},
      ]},
    });
    expect(p.variants.length, 2);
    expect(p.variants.first.options.first.typeLabel, 'Size');
    expect(p.variants.last.price, 14900);
  });

  test('a cart reads items, variants and the subtotal', () {
    final repo = ShopRepository(ApiClient(base: 'http://x'));
    expect(repo, isNotNull);
    expect(Address(firstName: 'A', lastName: 'B', addressLine1: 'x 1', city: 'Y', postalCode: '1000AA').oneLine, 'A B, x 1, 1000AA Y, NL');
  });

  test('rich text of a product description becomes plain text', () {
    expect(richText({'root': {'children': [{'type': 'paragraph', 'children': [{'type': 'text', 'text': 'Hello'}]}, {'type': 'paragraph', 'children': [{'type': 'text', 'text': 'World'}]}]}}), 'Hello\nWorld');
  });

  testWidgets('Lexical renders headings, bold text and lists', (tester) async {
    final doc = {'root': {'children': [
      {'type': 'heading', 'tag': 'h2', 'children': [{'type': 'text', 'text': 'Title', 'format': 0}]},
      {'type': 'paragraph', 'children': [{'type': 'text', 'text': 'Bold part', 'format': 1}]},
      {'type': 'list', 'listType': 'bullet', 'children': [{'type': 'listitem', 'children': [{'type': 'text', 'text': 'One'}]}]},
    ]}};
    await tester.pumpWidget(MaterialApp(theme: Ca7Theme.light(), builder: (c, w) => I18nScope(notifier: I18n(), child: w!), home: Scaffold(body: Lexical(doc))));
    expect(find.text('Title', findRichText: true), findsOneWidget);
    expect(find.textContaining('Bold part', findRichText: true), findsOneWidget);
    expect(find.textContaining('One', findRichText: true), findsOneWidget);
  });
}
