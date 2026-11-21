import 'package:flutter/material.dart';
import '../../app/theme/colors.dart';

/// Pill / rounded buttons used across the website.
class CaButton extends StatelessWidget {
  const CaButton(this.label, {super.key, this.onPressed, this.outlined = false, this.blue = false, this.small = false, this.icon, this.busy = false, this.link = false, this.expand = false});
  final String label;
  final VoidCallback? onPressed;
  /// Look of a button only: the tap is handled by a surrounding link.
  final bool outlined, blue, small, busy, link, expand;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final bg = blue ? Brand.blue : (outlined ? Colors.transparent : c.primaryBg);
    final fg = blue ? Colors.white : (outlined ? c.fg : c.primaryFg);
    return Opacity(
      opacity: onPressed == null && !link ? .5 : 1,
      child: Material(
        color: bg,
        shape: StadiumBorder(side: outlined ? BorderSide(color: c.border.withValues(alpha: .25)) : BorderSide.none),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: busy ? null : onPressed,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: small ? 16 : 20, vertical: small ? 7 : 11),
            child: Row(mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
              if (busy) SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: fg)) else if (icon != null) Icon(icon, size: 15, color: fg),
              if (busy || icon != null) const SizedBox(width: 6),
              Text(label, style: TextStyle(color: fg, fontSize: small ? 13 : 14, fontWeight: FontWeight.w500)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// `rounded-2xl bg-neutral-50 p-5` card used in the dashboard.
class CaCard extends StatelessWidget {
  const CaCard({super.key, this.title, this.action, required this.child, this.padding = const EdgeInsets.all(20), this.color});
  final String? title;
  final Widget? action;
  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(color: color ?? c.card, borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Flexible(child: Text(title!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
              if (action != null) action!,
            ]),
          ),
        child,
      ]),
    );
  }
}

class Muted extends StatelessWidget {
  const Muted(this.text, {super.key, this.size = 13, this.center = false});
  final String text;
  final double size;
  final bool center;
  @override
  Widget build(BuildContext context) => Text(text, textAlign: center ? TextAlign.center : null, style: TextStyle(fontSize: size, color: context.ca.muted, height: 1.45));
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 1.54, color: context.ca.faint));
}

/// Error / empty / loading blocks (the pages show these states).
class StateBox extends StatelessWidget {
  const StateBox.loading({super.key}) : message = null, error = false;
  const StateBox.empty(this.message, {super.key}) : error = false;
  const StateBox.error(this.message, {super.key}) : error = true;
  final String? message;
  final bool error;
  @override
  Widget build(BuildContext context) {
    if (message == null) return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    return CaCard(child: Text(message!, style: TextStyle(fontSize: 14, color: error ? Brand.red : context.ca.muted)));
  }
}

class CaField extends StatelessWidget {
  const CaField({super.key, required this.controller, this.label, this.hint, this.obscure = false, this.keyboard, this.validator, this.maxLines = 1, this.autofill, this.onSubmitted});
  final TextEditingController controller;
  final String? label, hint;
  final bool obscure;
  final TextInputType? keyboard;
  final String? Function(String?)? validator;
  final int maxLines;
  final Iterable<String>? autofill;
  final ValueChanged<String>? onSubmitted;
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (label != null) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(label!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: context.ca.muted))),
      TextFormField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboard,
        validator: validator,
        maxLines: maxLines,
        autofillHints: autofill,
        onFieldSubmitted: onSubmitted,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(hintText: hint),
      ),
    ]);
  }
}

/// A DataTable that is as wide as its card (like `w-full` on the website) and scrolls sideways when it must.
class FullTable extends StatelessWidget {
  const FullTable({super.key, required this.table});
  final DataTable table;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (_, box) => SingleChildScrollView(scrollDirection: Axis.horizontal, child: ConstrainedBox(constraints: BoxConstraints(minWidth: box.maxWidth), child: table)),
      );
}
