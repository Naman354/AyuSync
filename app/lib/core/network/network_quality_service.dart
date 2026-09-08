import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'api_config.dart';

enum NetworkStatus {
  online,  // Healthy, responsive connection
  poor,    // Low / unstable internet detected (high latency, dropped packets, timeout)
  offline, // Network interface turned off / disconnected
}

class NetworkQualityService {
  static final NetworkQualityService _instance = NetworkQualityService._internal();
  factory NetworkQualityService() => _instance;
  NetworkQualityService._internal();

  Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  Timer? _pollingTimer;

  NetworkStatus _currentStatus = NetworkStatus.online;
  NetworkStatus get currentStatus => _currentStatus;

  final _statusController = StreamController<NetworkStatus>.broadcast();
  Stream<NetworkStatus> get onStatusChanged => _statusController.stream;

  bool _isChecking = false;

  // Visible for testing / overrides
  void setConnectivityInstance(Connectivity connectivity) {
    _connectivity = connectivity;
  }

  void startMonitoring({Duration pollingInterval = const Duration(seconds: 10)}) {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((results) {
      checkStatus();
    });

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(pollingInterval, (_) {
      checkStatus();
    });

    // Run immediate check
    checkStatus();
  }

  void stopMonitoring() {
    _connectivitySubscription?.cancel();
    _pollingTimer?.cancel();
  }

  Future<NetworkStatus> checkStatus() async {
    if (_isChecking) return _currentStatus;
    _isChecking = true;

    try {
      final results = await _connectivity.checkConnectivity();

      // 1. If physical interface is disabled (airplane mode, Wi-Fi & cellular turned off)
      if (results.isEmpty || results.contains(ConnectivityResult.none)) {
        _updateStatus(NetworkStatus.offline);
        return NetworkStatus.offline;
      }

      // 2. Interface is connected (Wi-Fi or Mobile). Now probe real internet transit & quality.
      final quality = await _probeTransitQuality();
      _updateStatus(quality);
      return quality;
    } catch (_) {
      _updateStatus(NetworkStatus.poor);
      return NetworkStatus.poor;
    } finally {
      _isChecking = false;
    }
  }

  Future<NetworkStatus> _probeTransitQuality() async {
    try {
      final stopwatch = Stopwatch()..start();

      // Fast probe to backend /health (Render) with strict 2.5s timeout.
      // In field settings, if connection takes > 1.8s or times out, packets are stalling.
      final targetUri = Uri.parse('${ApiConfig.baseUrl}/health');
      final response = await http.get(targetUri).timeout(const Duration(milliseconds: 2500));
      stopwatch.stop();

      if (response.statusCode >= 200 && response.statusCode < 500) {
        if (stopwatch.elapsedMilliseconds > 1800) {
          // Slow 2G / poor signal -> Very low internet detected
          return NetworkStatus.poor;
        }
        return NetworkStatus.online;
      }

      // If backend is sleeping or returned 5xx, try fallback DNS lookup to check if general internet is up
      return await _fallbackDnsProbe();
    } on TimeoutException {
      // Exceeded 2.5s -> Very low or congested internet detected
      return NetworkStatus.poor;
    } on SocketException {
      // DNS lookup or socket failed -> No real connectivity
      return NetworkStatus.offline;
    } catch (_) {
      return await _fallbackDnsProbe();
    }
  }

  Future<NetworkStatus> _fallbackDnsProbe() async {
    try {
      final stopwatch = Stopwatch()..start();
      final result = await InternetAddress.lookup('dns.google').timeout(const Duration(milliseconds: 2000));
      stopwatch.stop();

      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        if (stopwatch.elapsedMilliseconds > 1500) {
          return NetworkStatus.poor;
        }
        return NetworkStatus.online;
      }
      return NetworkStatus.offline;
    } catch (_) {
      return NetworkStatus.offline;
    }
  }

  void _updateStatus(NetworkStatus newStatus) {
    if (_currentStatus != newStatus) {
      _currentStatus = newStatus;
      _statusController.add(newStatus);
    }
  }
}
