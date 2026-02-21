import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import RegisteredNavbar from "../components/RegisteredNavbar";
import UnregisteredNavbar from "../components/UnregisteredNavbar";
import { instrumentService } from "../services";
import { useAppAuth } from "../contexts/AuthContext";
import websocketService from "../services/websocketService";

const { width } = Dimensions.get("window");

const SEGMENTS = ["NSE", "MCX", "GLOBAL"];

export default function MarketWatchScreen({ route, navigation }) {
  const { isAuthenticated } = useAppAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [activeSegment, setActiveSegment] = useState("MCX");
  const [searchQuery, setSearchQuery] = useState("");
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const wsUnsubRef = useRef(null);

  const fetchInstruments = useCallback(async (silent = false) => {
    try {
      if (!refreshing && !silent) setLoading(true);
      setError(null);

      const res = await instrumentService.getMarketWatch(
        activeSegment === "GLOBAL" ? "ALL" : activeSegment,
      );
      const fetchedInstruments = res?.data?.instruments || [];

      setInstruments(fetchedInstruments);
    } catch (err) {
      console.log("Error fetching market watch instruments:", err.message);
      if (!silent) setError("Unable to load market data");
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeSegment, refreshing]);

  // Auto-refresh market prices every 3 seconds to show live fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInstruments(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchInstruments]);

  // WebSocket: real-time price updates for instruments on screen
  const handleWsPrice = useCallback((data) => {
    if (!data || !data.instrumentId) return;
    setInstruments((prev) =>
      prev.map((inst) => {
        const instId = inst.instrumentId || inst.id;
        // Match by instrumentId or by symbol (e.g., 'GOLD' vs 'GOLD/MCX')
        const normWs = (data.symbol || "").split("/")[0].toUpperCase();
        const normInst = (inst.symbol || "").toUpperCase();
        if (instId !== data.instrumentId && normInst !== normWs) return inst;

        return {
          ...inst,
          ltp: data.ltp ?? inst.ltp,
          high: data.high ?? inst.high,
          low: data.low ?? inst.low,
          change: data.change ?? inst.change,
          changePercent: data.changePercent ?? inst.changePercent,
          volume: data.volume ?? inst.volume,
          currentPrice: {
            ...(inst.currentPrice || {}),
            ltp: data.ltp ?? inst.currentPrice?.ltp,
            high: data.high ?? inst.currentPrice?.high,
            low: data.low ?? inst.currentPrice?.low,
            change: data.change ?? inst.currentPrice?.change,
            changePercent: data.changePercent ?? inst.currentPrice?.changePercent,
          },
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect().catch(console.error);
      wsUnsubRef.current = websocketService.subscribe("price", handleWsPrice);

      // Subscribe to all visible instruments
      instruments.forEach((inst) => {
        const id = inst.instrumentId || inst.id;
        if (id) websocketService.subscribeToInstrument(id);
      });
    }

    return () => {
      if (wsUnsubRef.current) {
        wsUnsubRef.current();
        wsUnsubRef.current = null;
      }
    };
  }, [isAuthenticated, handleWsPrice, instruments]);

  const navigateToChart = async (item) => {
    let userId = null;
    try {
      const cachedUser = await AsyncStorage.getItem("cachedUser");
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        userId = user?.id || user?.email || null;
      }
    } catch (e) {
      console.log("Error getting user ID:", e);
    }

    navigation.navigate("CoinChart", {
      symbol: item.symbol,
      instrumentId: item.instrumentId || item.id,
      isLoggedIn: isAuthenticated,
      userId,
    });
  };

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInstruments();
  };

  const filteredInstruments = instruments.filter(
    (inst) =>
      inst.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderInstrumentItem = (item) => {
    const isPositive =
      (item.currentPrice?.changePercent || item.changePercent || 0) >= 0;
    const changeVal = (item.currentPrice?.change || item.change || 0).toFixed(
      2,
    );
    const changePercent = (
      item.currentPrice?.changePercent ||
      item.changePercent ||
      0
    ).toFixed(2);
    const ltp = item.currentPrice?.ltp || item.ltp || 0;
    const high = item.currentPrice?.high || item.high || 0;
    const low = item.currentPrice?.low || item.low || 0;
    const expiry = item.expiryDate || item.expiry || "N/A";

    return (
      <TouchableOpacity
        key={item.id || item.instrumentId}
        style={[styles.instrumentItem, { borderBottomColor: colors.border }]}
        onPress={() => navigateToChart(item)}
      >
        {/* Row 1: Low, LTP Label, High Header */}
        <View style={styles.itemRow}>
          <View style={styles.col1}>
            <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>
              Low :{" "}
              <Text style={{ color: colors.textPrimary }}>
                {low.toFixed(2)}
              </Text>
            </Text>
          </View>
          <View style={styles.col2}>
            <Text
              style={[
                styles.labelSmall,
                { color: colors.textSecondary, textAlign: "center" },
              ]}
            >
              LTP :{" "}
              <Text style={{ color: colors.textPrimary }}>
                {ltp.toFixed(2)}
              </Text>
            </Text>
          </View>
          <View style={styles.col3}>
            <Text
              style={[
                styles.labelSmall,
                { color: colors.textSecondary, textAlign: "right" },
              ]}
            >
              High :{" "}
              <Text style={{ color: colors.textPrimary }}>
                {high.toFixed(2)}
              </Text>
            </Text>
          </View>
        </View>

        {/* Row 2: Symbol Name, Main LTP, High Price */}
        <View style={[styles.itemRow, { marginTop: 4 }]}>
          <View style={styles.col1}>
            <Text style={[styles.symbolName, { color: colors.textPrimary }]}>
              {item.symbol}
            </Text>
          </View>
          <View style={styles.col2}>
            <Text
              style={[
                styles.mainLtp,
                {
                  color: isPositive ? colors.green : colors.red,
                  textAlign: "center",
                },
              ]}
            >
              {ltp.toFixed(2)}
            </Text>
          </View>
          <View style={styles.col3}>
            <Text
              style={[
                styles.priceRight,
                {
                  color: isPositive ? colors.green : colors.red,
                  textAlign: "right",
                },
              ]}
            >
              {high.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Row 3: Expiry, Change Badge */}
        <View
          style={[styles.itemRow, { marginTop: 4, alignItems: "flex-end" }]}
        >
          <View style={styles.col1}>
            <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
              {expiry}
            </Text>
            <Text
              style={[
                styles.qtyText,
                { color: colors.textSecondary, marginTop: 4 },
              ]}
            >
              Qty : 0
            </Text>
          </View>
          <View style={styles.col2}>{/* Empty center */}</View>
          <View style={styles.col3}>
            <View
              style={[
                styles.changeBadge,
                { backgroundColor: isPositive ? colors.green : colors.red },
              ]}
            >
              <Text style={styles.changeBadgeText}>
                {isPositive ? "+" : ""}
                {changeVal} ({changePercent} %)
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Tabs */}
      <View
        style={[
          styles.headerTabs,
          { paddingTop: insets.top + 10, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.segmentContainer}>
          {SEGMENTS.map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[
                styles.segmentTab,
                activeSegment === seg && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.cardBackground },
                ],
              ]}
              onPress={() => setActiveSegment(seg)}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeSegment === seg
                        ? colors.textPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {seg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sub Header / Controls (search and top control buttons removed) */}
      <View style={{ height: 8 }} />

      {/* List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.green} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={{ color: colors.textSecondary }}>{error}</Text>
          </View>
        ) : filteredInstruments.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={{ color: colors.textSecondary }}>
              No instruments found
            </Text>
          </View>
        ) : (
          filteredInstruments.map(renderInstrumentItem)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navbar */}
      {isAuthenticated ? (
        <RegisteredNavbar navigation={navigation} activeScreen="Watchlist" />
      ) : (
        <UnregisteredNavbar navigation={navigation} activeScreen="Watchlist" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTabs: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  segmentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentTabActive: {
    // Background set dynamically
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  searchInput: {
    fontSize: 14,
    padding: 0,
  },
  iconButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  newExpiryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  newExpiryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  instrumentItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  col1: {
    flex: 1.5,
  },
  col2: {
    flex: 1.5,
  },
  col3: {
    flex: 1.5,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: "500",
  },
  symbolName: {
    fontSize: 14,
    fontWeight: "800",
  },
  mainLtp: {
    fontSize: 18,
    fontWeight: "800",
  },
  priceRight: {
    fontSize: 16,
    fontWeight: "700",
  },
  expiryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  qtyText: {
    fontSize: 11,
    fontWeight: "500",
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    minWidth: 90,
    alignItems: "center",
  },
  changeBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  centerContainer: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
