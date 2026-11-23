import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../app/theme/colors.dart';
import '../../core/widgets/atoms.dart';
import '../../app/theme/theme.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import '../home/dot_camera.dart';

/// Login look: pale cyan sky fading into deep indigo and black, a dot grid like the camera art and the dotted
/// camera itself at the top. Big uppercase white title, text and form at the bottom.
/// [top] is the share of the screen kept free above the content (the camera sits there).
Widget _frame(BuildContext context, String title, String intro, Widget form, {double top = .3, VoidCallback? onBack, String? backTo}) {
  final base = Ca7Theme.dark();
  OutlineInputBorder line(Color col) => OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: col));
  final dark = base.copyWith(
    inputDecorationTheme: base.inputDecorationTheme.copyWith(
      filled: true,
      fillColor: const Color(0x14FFFFFF),
      hintStyle: const TextStyle(color: Color(0x80FFFFFF)),
      border: line(const Color(0x33FFFFFF)),
      enabledBorder: line(const Color(0x33FFFFFF)),
      focusedBorder: line(const Color(0xCCFFFFFF)),
    ),
  );
  final minH = (MediaQuery.sizeOf(context).height - Ca7Theme.headerHeight).clamp(600.0, double.infinity);
  final fs = context.isDesktop ? 44.0 : 34.0;
  final back = onBack != null || backTo != null
      ? Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: backTo != null
                ? Lnk(to: backTo, child: const _BackIcon())
                : InkWell(onTap: onBack, customBorder: const CircleBorder(), child: const _BackIcon()),
          ),
        )
      : const SizedBox.shrink();
  return Container(
    width: double.infinity,
    constraints: BoxConstraints(minHeight: minH),
    child: Stack(children: [
      Positioned.fill(child: _AuthBackground(split: minH * top - 90)),
      Positioned(
        top: minH * .04,
        left: 0,
        right: 0,
        height: minH * math.max(top, .3),
        child: IgnorePointer(child: Center(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 560), child: const Opacity(opacity: .9, child: DotCamera()))))),
      ),
      Theme(
        data: dark,
        child: Container1280(
          padding: EdgeInsets.fromLTRB(24, 0, 24, context.isDesktop ? 64 : 40),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: DefaultTextStyle.merge(
                style: const TextStyle(color: Colors.white),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  SizedBox(height: minH * top),
                  back,
                  Text(title.toUpperCase(), style: TextStyle(fontSize: fs, fontWeight: FontWeight.w600, height: 1.05, letterSpacing: -fs * .02, color: Colors.white)),
                  const SizedBox(height: 14),
                  Text(intro, style: const TextStyle(fontSize: 16, height: 1.5, color: Color(0xD9FFFFFF))),
                  const SizedBox(height: 32),
                  form,
                ]),
              ),
            ),
          ),
        ),
      ),
    ]),
  );
}

class _BackIcon extends StatelessWidget {
  const _BackIcon();
  @override
  Widget build(BuildContext context) => Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0x1FFFFFFF), border: Border.all(color: const Color(0x33FFFFFF))),
        child: Tooltip(message: context.t('Back'), child: const Icon(Icons.arrow_back, size: 18, color: Colors.white)),
      );
}

/// Full-width white pill button (the main action of the login screens).
class _Pill extends StatelessWidget {
  const _Pill(this.label, {this.onPressed, this.busy = false});
  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 56,
        child: FilledButton(
          onPressed: busy ? null : onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: Neutral.c900,
            disabledBackgroundColor: const Color(0xB3FFFFFF),
            disabledForegroundColor: Neutral.c700,
            shape: const StadiumBorder(),
            textStyle: const TextStyle(fontFamily: 'Geist', fontSize: 16, fontWeight: FontWeight.w500),
          ),
          child: Text(label),
        ),
      );
}

/// Gradient sky + grid of small dots that gets stronger towards the bottom. [split] is where (in pixels from the
/// top) the deep indigo starts, so the white text below it is always on a dark part.
class _AuthBackground extends StatelessWidget {
  const _AuthBackground({required this.split});
  final double split;
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (_, box) {
        final h = box.maxHeight;
        double f(double px) => (px / h).clamp(0.0, 1.0);
        return DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: const [Color(0xFFE4FAFB), Color(0xFFC9E6F2), Color(0xFF8FA8E0), Color(0xFF3B3FA8), Color(0xFF12164A), Color(0xFF05060F)],
              stops: [0, f(split * .45), f(split * .8), f(split + 40), f(split + 220), 1],
            ),
          ),
          child: CustomPaint(painter: _DotGrid(split * .6), size: Size.infinite),
        );
      });
}

class _DotGrid extends CustomPainter {
  const _DotGrid(this.from);
  final double from;
  @override
  void paint(Canvas canvas, Size size) {
    const gap = 14.0;
    final p = Paint();
    for (var y = gap / 2; y < size.height; y += gap) {
      if (y < from) continue;
      final a = ((y - from) / 320).clamp(0.0, 1.0);
      p.color = Color.lerp(Brand.dot, const Color(0xFF9DB4FF), a)!.withValues(alpha: .08 + .14 * a);
      for (var x = gap / 2; x < size.width; x += gap) {
        canvas.drawCircle(Offset(x, y), 1.1, p);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DotGrid old) => old.from != from;
}

String? _target(BuildContext context) => GoRouterState.of(context).uri.queryParameters['redirect'];

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController(), _pw = TextEditingController();
  String? _error;
  bool _busy = false, _show = false;
  /// First the welcome screen (create an account / log in); `?form=1` opens the e-mail and password step directly.
  late bool _welcome = GoRouterState.of(context).uri.queryParameters['form'] == null;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      final user = await ref.read(authProvider).login(_email.text.trim(), _pw.text);
      if (!mounted) return;
      // the account remembers the customer's language: open the site in it
      final lang = isLang(user.language) ? user.language : context.lang;
      await ref.read(i18nProvider).setLang(lang);
      if (!mounted) return;
      final to = _target(context) ?? '/dashboard';
      context.go(to.startsWith(RegExp(r'/[a-z]{2}(/|$)')) ? to : '/$lang$to');
    } catch (_) {
      setState(() => _error = context.t('There was an error with the credentials provided. Please try again.'));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final params = Map.of(GoRouterState.of(context).uri.queryParameters)..remove('form');
    final qp = Uri(queryParameters: params.isEmpty ? null : params).query;
    final extra = qp.isEmpty ? '' : '?$qp';
    if (_welcome) {
      return _frame(
        context,
        context.t('The AI brain for your business'),
        context.t('Connect your data, ask questions and automate. Secure, simple and built for the way your teams work.'),
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _Pill(context.t('Create an account'), onPressed: () => context.goL('/create-account$extra')),
          const SizedBox(height: 12),
          SizedBox(
            height: 52,
            child: TextButton(
              onPressed: () => setState(() => _welcome = false),
              style: TextButton.styleFrom(foregroundColor: Colors.white, shape: const StadiumBorder(), textStyle: const TextStyle(fontFamily: 'Geist', fontSize: 16, fontWeight: FontWeight.w500)),
              child: Text(context.t('I already have an account')),
            ),
          ),
        ]),
        top: .5,
      );
    }
    return _frame(
      context,
      context.t('Log in'),
      context.t('Log in to manage your account and review your order history.'),
      onBack: () => setState(() { _welcome = true; _error = null; }),
      Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_error != null) _Message(_error!),
          CaField(controller: _email, label: context.t('Email'), keyboard: TextInputType.emailAddress, autofill: const [AutofillHints.email], validator: (v) => (v ?? '').trim().isEmpty ? context.t('Email is required.') : null),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(context.t('Password'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xB3FFFFFF))),
            Lnk(to: '/forgot-password$extra', child: Text(context.t('Forgot your password?'), style: TextStyle(fontSize: 12, color: const Color(0xB3FFFFFF), decoration: TextDecoration.underline))),
          ]),
          const SizedBox(height: 6),
          TextFormField(
            controller: _pw,
            obscureText: !_show,
            autofillHints: const [AutofillHints.password],
            onFieldSubmitted: (_) => _submit(),
            validator: (v) => (v ?? '').isEmpty ? context.t('Please provide a password.') : null,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(suffixIcon: TextButton(onPressed: () => setState(() => _show = !_show), child: Text(_show ? context.t('Hide') : context.t('Show'), style: TextStyle(fontSize: 12, color: const Color(0xB3FFFFFF))))),
          ),
          const SizedBox(height: 24),
          _Pill(_busy ? context.t('Processing') : context.t('Continue'), onPressed: _submit, busy: _busy),
          const SizedBox(height: 24),
          Center(child: Lnk(to: '/create-account$extra', child: Text(context.t('Create an account'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, decoration: TextDecoration.underline)))),
        ]),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message(this.text, {this.ok = false});
  final String text;
  final bool ok;
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: (ok ? Colors.green : Colors.red).withValues(alpha: .12), border: Border.all(color: ok ? Colors.green : Colors.red), borderRadius: BorderRadius.circular(8)),
        child: Text(text, style: const TextStyle(fontSize: 14)),
      );
}

class CreateAccountPage extends ConsumerStatefulWidget {
  const CreateAccountPage({super.key});
  @override
  ConsumerState<CreateAccountPage> createState() => _CreateAccountPageState();
}

class _CreateAccountPageState extends ConsumerState<CreateAccountPage> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController(), _pw = TextEditingController(), _pw2 = TextEditingController();
  String? _lang, _error;
  bool _busy = false;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final lang = _lang ?? context.lang;
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(authProvider).signup(email: _email.text.trim(), password: _pw.text, language: lang);
      await ref.read(i18nProvider).setLang(lang);
      if (!mounted) return;
      final to = _target(context) ?? '/dashboard';
      context.go(to.startsWith(RegExp(r'/[a-z]{2}(/|$)')) ? to : '/$lang$to');
    } catch (e) {
      setState(() => _error = e.toString().isEmpty ? context.t('There was an error creating the account.') : e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final qp = GoRouterState.of(context).uri.query;
    return _frame(
      context,
      context.t('Create account'),
      context.t('Create an account to save your orders and your language.'),
      backTo: '/login${qp.isEmpty ? '' : '?$qp'}',
      Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_error != null) _Message(_error!),
          CaField(controller: _email, label: context.t('Email address'), keyboard: TextInputType.emailAddress, validator: (v) => (v ?? '').trim().isEmpty ? context.t('Email is required.') : null),
          const SizedBox(height: 24),
          CaField(controller: _pw, label: context.t('New password'), obscure: true, validator: (v) => (v ?? '').isEmpty ? context.t('Password is required.') : null),
          const SizedBox(height: 24),
          CaField(controller: _pw2, label: context.t('Confirm password'), obscure: true, validator: (v) => (v ?? '').isEmpty ? context.t('Please confirm your password.') : (v != _pw.text ? context.t('The passwords do not match') : null)),
          const SizedBox(height: 24),
          Text(context.t('Language'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            initialValue: _lang ?? context.lang,
            items: [for (final l in languages) DropdownMenuItem(value: l.code, child: Text('${l.flag} ${l.name}'))],
            onChanged: (v) => setState(() => _lang = v),
            decoration: const InputDecoration(),
          ),
          const SizedBox(height: 24),
          _Pill(_busy ? context.t('Processing') : context.t('Create account'), onPressed: _submit, busy: _busy),
          const SizedBox(height: 24),
          Wrap(alignment: WrapAlignment.center, children: [Text('${context.t('Already have an account?')} ', style: const TextStyle(fontSize: 14)), Lnk(to: '/login?form=1${qp.isEmpty ? '' : '&$qp'}', child: Text(context.t('Log in'), style: const TextStyle(fontSize: 14, decoration: TextDecoration.underline)))]),
        ]),
      ),
    );
  }
}

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});
  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _email = TextEditingController();
  bool _busy = false, _sent = false;
  String? _error;

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty) return setState(() => _error = context.t('Email is required.'));
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(authProvider).forgotPassword(_email.text.trim());
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => _frame(
        context,
        context.t('Forgot password'),
        context.t('Enter your email address. You will receive an email with a link to reset your password.'),
        backTo: '/login?form=1',
        _sent
            ? _Message(context.t('Check your email for a link that will allow you to securely reset your password.'), ok: true)
            : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                if (_error != null) _Message(_error!),
                CaField(controller: _email, label: context.t('Email'), keyboard: TextInputType.emailAddress, onSubmitted: (_) => _submit()),
                const SizedBox(height: 24),
                _Pill(_busy ? context.t('Processing') : context.t('Forgot password'), onPressed: _submit, busy: _busy),
              ]),
      );
}

/// Where the e-mail link of "forgot password" lands (?token=...): sets the new password.
class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});
  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _pw = TextEditingController(), _pw2 = TextEditingController();
  bool _busy = false, _done = false;
  String? _error;

  Future<void> _submit() async {
    final token = GoRouterState.of(context).uri.queryParameters['token'];
    if (token == null || token.isEmpty) return setState(() => _error = context.t('This link is not valid.'));
    if (_pw.text.length < 8) return setState(() => _error = context.t('Use at least 8 characters.'));
    if (_pw.text != _pw2.text) return setState(() => _error = context.t('The passwords do not match'));
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(apiClientProvider).post('/api/users/reset-password', body: {'token': token, 'password': _pw.text});
      setState(() => _done = true);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => _frame(
        context,
        context.t('Reset password'),
        context.t('Choose a new password for your account.'),
        _done
            ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _Message(context.t('Your password is changed. You can log in now.'), ok: true),
                _Pill(context.t('Log in'), onPressed: () => context.goL('/login?form=1')),
              ])
            : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                if (_error != null) _Message(_error!),
                CaField(controller: _pw, label: context.t('New password'), obscure: true),
                const SizedBox(height: 20),
                CaField(controller: _pw2, label: context.t('Confirm password'), obscure: true, onSubmitted: (_) => _submit()),
                const SizedBox(height: 24),
                _Pill(_busy ? context.t('Processing') : context.t('Reset password'), onPressed: _submit, busy: _busy),
              ]),
      );
}
