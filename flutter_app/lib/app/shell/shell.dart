import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers.dart';
import '../theme/theme.dart';
import 'footer.dart';
import 'header.dart';
import 'mobile_menu.dart';

/// Header + page + footer around every page; keeps the language in sync with the address (/nl/...).
class Shell extends ConsumerStatefulWidget {
  const Shell({super.key, required this.lang, required this.child, this.location = ''});
  final String lang;
  final String location;
  final Widget child;
  @override
  ConsumerState<Shell> createState() => _ShellState();
}

class _ShellState extends ConsumerState<Shell> {
  final _key = GlobalKey<ScaffoldState>();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(i18nProvider).setLang(widget.lang));
  }

  @override
  void didUpdateWidget(covariant Shell old) {
    super.didUpdateWidget(old);
    if (old.lang != widget.lang) ref.read(i18nProvider).setLang(widget.lang);
    if (old.location != widget.location && _scroll.hasClients) _scroll.jumpTo(0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _key,
      endDrawer: const MobileMenu(),
      body: Column(children: [
        SiteHeader(onMenu: () => _key.currentState?.openEndDrawer()),
        Expanded(
          child: SingleChildScrollView(
            controller: _scroll,
            child: Column(children: [
              ConstrainedBox(constraints: BoxConstraints(minHeight: MediaQuery.sizeOf(context).height - Ca7Theme.headerHeight - 400), child: widget.child),
              const SiteFooter(),
            ]),
          ),
        ),
      ]),
    );
  }
}
