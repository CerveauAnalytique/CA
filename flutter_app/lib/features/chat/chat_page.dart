import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show LogicalKeyboardKey;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/colors.dart';
import '../../core/errors/app_exception.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/responsive.dart';

class ChatMessage {
  ChatMessage(this.role, this.content, {this.error = false});
  final String role; // user | assistant
  String content;
  bool error;
}

const _suggestions = [
  'Summarise these sensor readings: 21.4, 21.6, 35.2, 21.5',
  'Write a SQL query for daily device events',
  'How do I share my data through the API?',
  'Which anomalies matter in temperature data?',
];

/// CA7 chat: streams the answer from POST /api/ca/chat (plain text), same as the website.
class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});
  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _messages = <ChatMessage>[];
  final _input = TextEditingController();
  final _scroll = ScrollController();
  StreamSubscription<String>? _sub;
  bool _busy = false, _askedFromUrl = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_askedFromUrl) return;
    _askedFromUrl = true;
    final q = GoRouterState.of(context).uri.queryParameters['q'];
    if (q != null && q.trim().isNotEmpty) WidgetsBinding.instance.addPostFrameCallback((_) => _send(q));
  }

  @override
  void dispose() {
    _sub?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 120), curve: Curves.easeOut);
      });

  Future<void> _send(String text) async {
    final q = text.trim();
    if (q.isEmpty || _busy) return;
    final fallback = context.t('CA7 could not answer right now.');
    final history = [..._messages.map((m) => {'role': m.role, 'content': m.content}), {'role': 'user', 'content': q}];
    final bot = ChatMessage('assistant', '');
    setState(() {
      _messages..add(ChatMessage('user', q))..add(bot);
      _input.clear();
      _busy = true;
    });
    _toBottom();
    final done = Completer<void>();
    _sub = ref.read(apiClientProvider).streamText('/api/ca/chat', {'messages': history}).listen(
      (chunk) {
        setState(() => bot.content += chunk);
        _toBottom();
      },
      onError: (e) {
        setState(() {
          bot.content = e is AppException && e.message.isNotEmpty ? e.message : fallback;
          bot.error = true;
        });
        done.complete();
      },
      onDone: () => done.complete(),
      cancelOnError: true,
    );
    await done.future;
    if (mounted) setState(() => _busy = false);
  }

  void _stop() {
    _sub?.cancel();
    setState(() => _busy = false);
  }

  void _reset() {
    _sub?.cancel();
    setState(() {
      _messages.clear();
      _busy = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final minH = (MediaQuery.sizeOf(context).height - 56).clamp(560.0, double.infinity);
    return Container1280(
      child: SizedBox(
        height: minH,
        child: Column(children: [
          SizedBox(
            height: 56,
            child: Align(
              alignment: AlignmentDirectional.centerEnd,
              child: _messages.isEmpty ? null : OutlinedButton.icon(onPressed: _reset, icon: const Icon(Icons.add, size: 13), label: Text(context.t('New chat'), style: const TextStyle(fontSize: 12)), style: OutlinedButton.styleFrom(shape: const StadiumBorder(), foregroundColor: c.fg)),
            ),
          ),
          Expanded(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 768),
                child: Column(children: [
                  Expanded(
                    child: _messages.isEmpty
                        ? _Welcome(onPick: _send)
                        : ListView.separated(
                            controller: _scroll,
                            padding: const EdgeInsets.only(bottom: 24),
                            itemCount: _messages.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 24),
                            itemBuilder: (_, i) => _Bubble(_messages[i], busy: _busy && i == _messages.length - 1),
                          ),
                  ),
                  _Composer(controller: _input, busy: _busy, onSend: () => _send(_input.text), onStop: _stop),
                  Padding(padding: const EdgeInsets.fromLTRB(0, 8, 0, 20), child: Text(context.t('CA7 can make mistakes. Check important numbers.'), style: TextStyle(fontSize: 11, color: c.faint))),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _Brain extends StatelessWidget {
  const _Brain(this.size);
  final double size;
  @override
  Widget build(BuildContext context) => SvgPicture.asset('assets/brand/brain.svg', width: size, height: size, theme: SvgTheme(currentColor: context.ca.fg));
}

class _Welcome extends StatelessWidget {
  const _Welcome({required this.onPick});
  final ValueChanged<String> onPick;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 48),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const _Brain(56),
          const SizedBox(height: 24),
          Text(context.t('What can CA7 help you with?'), textAlign: TextAlign.center, style: TextStyle(fontSize: (context.width * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
          const SizedBox(height: 12),
          ConstrainedBox(constraints: const BoxConstraints(maxWidth: 448), child: Text(context.t('The AI that is very good with data: IoT, sensors, SQL, analytics.'), textAlign: TextAlign.center, style: TextStyle(fontSize: 15, color: c.muted))),
          const SizedBox(height: 32),
          LayoutBuilder(builder: (_, box) {
            final two = box.maxWidth >= 600;
            final w = two ? (box.maxWidth - 10) / 2 : box.maxWidth;
            return Wrap(spacing: 10, runSpacing: 10, children: [
              for (final s in _suggestions)
                SizedBox(
                  width: w,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => onPick(context.t(s)),
                    child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(border: Border.all(color: Neutral.c200), borderRadius: BorderRadius.circular(16)), child: Text(context.t(s), style: TextStyle(fontSize: 14, color: c.fg))),
                  ),
                ),
            ]);
          }),
        ]),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.m, {required this.busy});
  final ChatMessage m;
  final bool busy;
  @override
  Widget build(BuildContext context) {
    if (m.role == 'user') {
      return Align(
        alignment: AlignmentDirectional.centerEnd,
        child: Container(
          constraints: BoxConstraints(maxWidth: context.width * .8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(color: Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800, borderRadius: BorderRadius.circular(20)),
          child: SelectableText(m.content, style: const TextStyle(fontSize: 15, height: 1.5)),
        ),
      );
    }
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(top: 4, right: 12), child: _Brain(24)),
      Expanded(
        child: m.content.isEmpty && busy
            ? const _Typing()
            : _Rich(m.content, error: m.error),
      ),
    ]);
  }
}

class _Typing extends StatefulWidget {
  const _Typing();
  @override
  State<_Typing> createState() => _TypingState();
}

class _TypingState extends State<_Typing> with SingleTickerProviderStateMixin {
  late final AnimationController _a = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  @override
  void dispose() {
    _a.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: AnimatedBuilder(
          animation: _a,
          builder: (_, __) => Row(mainAxisSize: MainAxisSize.min, children: [
            for (var i = 0; i < 3; i++)
              Container(margin: const EdgeInsets.only(right: 4), width: 6, height: 6, transform: Matrix4.translationValues(0, -3 * ((_a.value * 3 - i).clamp(0.0, 1.0) * (1 - (_a.value * 3 - i).clamp(0.0, 1.0)) * 4), 0), decoration: const BoxDecoration(color: Neutral.c400, shape: BoxShape.circle)),
          ]),
        ),
      );
}

/// Text with ``` code blocks, like the website.
class _Rich extends StatelessWidget {
  const _Rich(this.text, {this.error = false});
  final String text;
  final bool error;
  @override
  Widget build(BuildContext context) {
    // interleave in order
    final out = <Widget>[];
    var cursor = 0;
    for (final m in RegExp(r'```[\s\S]*?(?:```|$)').allMatches(text)) {
      if (m.start > cursor) out.add(SelectableText(text.substring(cursor, m.start), style: TextStyle(fontSize: 15, height: 1.6, color: error ? Brand.red : null)));
      final body = m.group(0)!.replaceFirst(RegExp(r'^```[^\n]*\n?'), '').replaceFirst(RegExp(r'```$'), '');
      out.add(Container(width: double.infinity, margin: const EdgeInsets.symmetric(vertical: 12), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)), child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: SelectableText(body, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12.5, height: 1.6, color: Neutral.c100)))));
      cursor = m.end;
    }
    if (cursor < text.length) out.add(SelectableText(text.substring(cursor), style: TextStyle(fontSize: 15, height: 1.6, color: error ? Brand.red : null)));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: out);
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.busy, required this.onSend, required this.onStop});
  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSend, onStop;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 8, 8, 8),
      decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(28), border: Border.all(color: Neutral.c200), boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 40, offset: Offset(0, 20))]),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(
          child: Shortcuts(
            shortcuts: const {SingleActivator(LogicalKeyboardKey.enter): _SendIntent()},
            child: Actions(
              actions: {_SendIntent: CallbackAction<_SendIntent>(onInvoke: (_) { onSend(); return null; })},
              child: TextField(controller: controller, minLines: 1, maxLines: 6, style: const TextStyle(fontSize: 15), decoration: InputDecoration(hintText: context.t('Ask CA7 anything…'), filled: false, border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none)),
            ),
          ),
        ),
        busy
            ? IconButton.filled(tooltip: context.t('Stop'), onPressed: onStop, icon: const Icon(Icons.stop, size: 16), style: IconButton.styleFrom(backgroundColor: c.primaryBg, foregroundColor: c.primaryFg))
            : IconButton.filled(tooltip: context.t('Send'), onPressed: onSend, icon: const Icon(Icons.arrow_upward, size: 16), style: IconButton.styleFrom(backgroundColor: c.primaryBg, foregroundColor: c.primaryFg)),
      ]),
    );
  }
}

class _SendIntent extends Intent {
  const _SendIntent();
}
