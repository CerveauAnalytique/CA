/// An error from the backend or the network, with a message that can be shown to the user.
class AppException implements Exception {
  AppException(this.message, {this.status});
  final String message;
  final int? status;

  bool get unauthorized => status == 401 || status == 403;
  bool get limitReached => status == 402;

  @override
  String toString() => message;
}
