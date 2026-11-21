import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

Widget _frame(BuildContext context, String title, String intro, Widget form) => Container1280(
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 576),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 48),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 28.8, height: 1.2)),
              const SizedBox(height: 16),
              Text(intro, style: const TextStyle(fontSize: 16, height: 1.5)),
              const SizedBox(height: 32),
              form,
            ]),
          ),
        ),
      ),
    );

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
  bool _busy = false;

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
    final qp = GoRouterState.of(context).uri.query;
    final extra = qp.isEmpty ? '' : '?$qp';
    return _frame(
      context,
      context.t('Log in'),
      context.t('Log in to manage your account and review your order history.'),
      Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (_error != null) _Message(_error!),
          CaField(controller: _email, label: context.t('Email'), keyboard: TextInputType.emailAddress, autofill: const [AutofillHints.email], validator: (v) => (v ?? '').trim().isEmpty ? context.t('Email is required.') : null),
          const SizedBox(height: 32),
          CaField(controller: _pw, label: context.t('Password'), obscure: true, autofill: const [AutofillHints.password], onSubmitted: (_) => _submit(), validator: (v) => (v ?? '').isEmpty ? context.t('Please provide a password.') : null),
          const SizedBox(height: 24),
          Wrap(children: [Text('${context.t('Forgot your password?')} ', style: const TextStyle(fontSize: 14)), Lnk(to: '/forgot-password$extra', child: Text(context.t('Click here to reset it'), style: const TextStyle(fontSize: 14, decoration: TextDecoration.underline)))]),
          const SizedBox(height: 24),
          Row(children: [
            Lnk(to: '/create-account$extra', child: CaButton(context.t('Create an account'), outlined: true)),
            const Spacer(),
            CaButton(_busy ? context.t('Processing') : context.t('Continue'), onPressed: _submit, busy: _busy),
          ]),
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
      Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
          CaButton(_busy ? context.t('Processing') : context.t('Create account'), onPressed: _submit, busy: _busy),
          const SizedBox(height: 24),
          Wrap(children: [Text('${context.t('Already have an account?')} ', style: const TextStyle(fontSize: 14)), Lnk(to: '/login${qp.isEmpty ? '' : '?$qp'}', child: Text(context.t('Log in'), style: const TextStyle(fontSize: 14, decoration: TextDecoration.underline)))]),
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
        _sent
            ? _Message(context.t('Check your email for a link that will allow you to securely reset your password.'), ok: true)
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (_error != null) _Message(_error!),
                CaField(controller: _email, label: context.t('Email'), keyboard: TextInputType.emailAddress, onSubmitted: (_) => _submit()),
                const SizedBox(height: 24),
                CaButton(_busy ? context.t('Processing') : context.t('Forgot password'), onPressed: _submit, busy: _busy),
              ]),
      );
}
