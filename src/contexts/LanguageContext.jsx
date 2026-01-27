import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

// Translation strings
const translations = {
  English: {
    // Navigation
    welcome: 'Welcome',
    home: 'Home',
    trade: 'Trade',
    wallet: 'Wallet',
    position: 'Position',
    profile: 'Profile',
    market: 'Market',

    // Home Screen
    yourBalance: 'Your balance',
    todayPnl: "Today's PNL",
    addFund: 'Add fund',
    topGainers: 'Top gainers',
    topLosers: 'Top losers',
    mostActive: 'Most active',
    favorites: 'Favorites',
    loadingMarketData: 'Loading market data...',
    noInstrumentsFound: 'No instruments found',
    noFavoritesYet: 'No favorites yet. Add instruments to your watchlist.',
    loginToViewFavorites: 'Login to view your favorites',
    noInstrumentsAvailable: 'No instruments available for',

    // Trading
    buy: 'Buy',
    sell: 'Sell',
    orderBooks: 'Order books',
    positions: 'Positions',
    orders: 'Orders',
    ordersAndPositions: 'Orders and positions',
    pending: 'Pending',
    closed: 'Closed',
    open: 'Open',
    close: 'Close',
    modify: 'Modify',
    noOpenPositions: 'No open positions',
    noOrders: 'No {type} orders',

    // Profile Screen
    account: 'Account',
    profileInformation: 'Profile Information',
    profileInfoDesc: 'View and manage your personal account',
    preference: 'Preference',
    preferenceDesc: 'Customize how your trading app looks',
    security: 'Security',
    securityDesc: 'Keep your trading account secure',
    connectionTest: 'Connection Test',
    connectionTestDesc: 'Test backend API connections',
    appInfo: 'App Info',
    appInfoDesc: 'Access important details, support, and legal',
    logout: 'Logout',

    // Wallet Screen
    addFunds: 'Add funds',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transactionHistory: 'Transaction history',
    noTransactionsYet: 'No transactions yet',
    amountToDeposit: 'Amount to deposit',
    amountToWithdraw: 'Amount to withdraw',
    remarks: 'Remarks',
    optionalRemarks: 'Optional remarks',
    enterAmount: 'Enter amount',
    processing: 'Processing...',
    confirm: 'Confirm',

    // Settings
    preferences: 'Preferences',
    language: 'Language',
    themeMode: 'Theme mode',
    marketSegment: 'Market segment',
    defaultOrderType: 'Default Order type',

    // Common
    retry: 'Retry',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    apply: 'Apply',
    reset: 'Reset',
  },
  Hindi: {
    // Navigation
    welcome: 'स्वागत है',
    home: 'होम',
    trade: 'ट्रेड',
    wallet: 'वॉलेट',
    position: 'पोजीशन',
    profile: 'प्रोफाइल',
    market: 'मार्केट',

    // Home Screen
    yourBalance: 'आपका बैलेंस',
    todayPnl: 'आज का PNL',
    addFund: 'फंड जोड़ें',
    topGainers: 'टॉप गेनर्स',
    topLosers: 'टॉप लूज़र्स',
    mostActive: 'सबसे सक्रिय',
    favorites: 'पसंदीदा',
    loadingMarketData: 'मार्केट डेटा लोड हो रहा है...',
    noInstrumentsFound: 'कोई इंस्ट्रूमेंट नहीं मिला',
    noFavoritesYet: 'अभी तक कोई पसंदीदा नहीं। अपनी वॉचलिस्ट में इंस्ट्रूमेंट जोड़ें।',
    loginToViewFavorites: 'अपने पसंदीदा देखने के लिए लॉगिन करें',
    noInstrumentsAvailable: 'के लिए कोई इंस्ट्रूमेंट उपलब्ध नहीं',

    // Trading
    buy: 'खरीदें',
    sell: 'बेचें',
    orderBooks: 'ऑर्डर बुक्स',
    positions: 'पोजीशन',
    orders: 'ऑर्डर',
    ordersAndPositions: 'ऑर्डर और पोजीशन',
    pending: 'लंबित',
    closed: 'बंद',
    open: 'खुला',
    close: 'बंद करें',
    modify: 'संशोधित करें',
    noOpenPositions: 'कोई खुली पोजीशन नहीं',
    noOrders: 'कोई {type} ऑर्डर नहीं',

    // Profile Screen
    account: 'खाता',
    profileInformation: 'प्रोफाइल जानकारी',
    profileInfoDesc: 'अपने व्यक्तिगत खाते को देखें और प्रबंधित करें',
    preference: 'प्राथमिकता',
    preferenceDesc: 'अपने ट्रेडिंग ऐप के दिखने का तरीका कस्टमाइज़ करें',
    security: 'सुरक्षा',
    securityDesc: 'अपने ट्रेडिंग खाते को सुरक्षित रखें',
    connectionTest: 'कनेक्शन टेस्ट',
    connectionTestDesc: 'बैकएंड API कनेक्शन का परीक्षण करें',
    appInfo: 'ऐप जानकारी',
    appInfoDesc: 'महत्वपूर्ण विवरण, सहायता और कानूनी जानकारी तक पहुंचें',
    logout: 'लॉगआउट',

    // Wallet Screen
    addFunds: 'फंड जोड़ें',
    deposit: 'जमा करें',
    withdraw: 'निकालें',
    transactionHistory: 'लेनदेन इतिहास',
    noTransactionsYet: 'अभी तक कोई लेनदेन नहीं',
    amountToDeposit: 'जमा करने की राशि',
    amountToWithdraw: 'निकालने की राशि',
    remarks: 'टिप्पणी',
    optionalRemarks: 'वैकल्पिक टिप्पणी',
    enterAmount: 'राशि दर्ज करें',
    processing: 'प्रोसेसिंग...',
    confirm: 'पुष्टि करें',

    // Settings
    preferences: 'प्राथमिकताएं',
    language: 'भाषा',
    themeMode: 'थीम मोड',
    marketSegment: 'मार्केट सेगमेंट',
    defaultOrderType: 'डिफ़ॉल्ट ऑर्डर प्रकार',

    // Common
    retry: 'पुनः प्रयास करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    sort: 'क्रमबद्ध करें',
    apply: 'लागू करें',
    reset: 'रीसेट करें',
  },
  Spanish: {
    // Navigation
    welcome: 'Bienvenido',
    home: 'Inicio',
    trade: 'Comercio',
    wallet: 'Cartera',
    position: 'Posición',
    profile: 'Perfil',
    market: 'Mercado',

    // Home Screen
    yourBalance: 'Tu saldo',
    todayPnl: 'PNL de hoy',
    addFund: 'Agregar fondos',
    topGainers: 'Principales ganadores',
    topLosers: 'Principales perdedores',
    mostActive: 'Más activos',
    favorites: 'Favoritos',
    loadingMarketData: 'Cargando datos del mercado...',
    noInstrumentsFound: 'No se encontraron instrumentos',
    noFavoritesYet: 'Aún no hay favoritos. Agrega instrumentos a tu lista de seguimiento.',
    loginToViewFavorites: 'Inicia sesión para ver tus favoritos',
    noInstrumentsAvailable: 'No hay instrumentos disponibles para',

    // Trading
    buy: 'Comprar',
    sell: 'Vender',
    orderBooks: 'Libros de órdenes',
    positions: 'Posiciones',
    orders: 'Órdenes',
    ordersAndPositions: 'Órdenes y posiciones',
    pending: 'Pendiente',
    closed: 'Cerrado',
    open: 'Abierto',
    close: 'Cerrar',
    modify: 'Modificar',
    noOpenPositions: 'No hay posiciones abiertas',
    noOrders: 'No hay órdenes {type}',

    // Profile Screen
    account: 'Cuenta',
    profileInformation: 'Información del perfil',
    profileInfoDesc: 'Ver y administrar tu cuenta personal',
    preference: 'Preferencia',
    preferenceDesc: 'Personaliza cómo se ve tu aplicación de trading',
    security: 'Seguridad',
    securityDesc: 'Mantén tu cuenta de trading segura',
    connectionTest: 'Prueba de conexión',
    connectionTestDesc: 'Probar conexiones API del backend',
    appInfo: 'Información de la aplicación',
    appInfoDesc: 'Accede a detalles importantes, soporte y legal',
    logout: 'Cerrar sesión',

    // Wallet Screen
    addFunds: 'Agregar fondos',
    deposit: 'Depositar',
    withdraw: 'Retirar',
    transactionHistory: 'Historial de transacciones',
    noTransactionsYet: 'Aún no hay transacciones',
    amountToDeposit: 'Cantidad a depositar',
    amountToWithdraw: 'Cantidad a retirar',
    remarks: 'Observaciones',
    optionalRemarks: 'Observaciones opcionales',
    enterAmount: 'Ingresa la cantidad',
    processing: 'Procesando...',
    confirm: 'Confirmar',

    // Settings
    preferences: 'Preferencias',
    language: 'Idioma',
    themeMode: 'Modo de tema',
    marketSegment: 'Segmento de mercado',
    defaultOrderType: 'Tipo de orden predeterminado',

    // Common
    retry: 'Reintentar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    apply: 'Aplicar',
    reset: 'Restablecer',
  },
  German: {
    // Navigation
    welcome: 'Willkommen',
    home: 'Startseite',
    trade: 'Handel',
    wallet: 'Geldbörse',
    position: 'Position',
    profile: 'Profil',
    market: 'Markt',

    // Home Screen
    yourBalance: 'Ihr Guthaben',
    todayPnl: 'Heutiger PNL',
    addFund: 'Geld hinzufügen',
    topGainers: 'Top-Gewinner',
    topLosers: 'Top-Verlierer',
    mostActive: 'Am aktivsten',
    favorites: 'Favoriten',
    loadingMarketData: 'Marktdaten werden geladen...',
    noInstrumentsFound: 'Keine Instrumente gefunden',
    noFavoritesYet: 'Noch keine Favoriten. Fügen Sie Instrumente zu Ihrer Watchlist hinzu.',
    loginToViewFavorites: 'Melden Sie sich an, um Ihre Favoriten anzuzeigen',
    noInstrumentsAvailable: 'Keine Instrumente verfügbar für',

    // Trading
    buy: 'Kaufen',
    sell: 'Verkaufen',
    orderBooks: 'Auftragsbücher',
    positions: 'Positionen',
    orders: 'Aufträge',
    ordersAndPositions: 'Aufträge und Positionen',
    pending: 'Ausstehend',
    closed: 'Geschlossen',
    open: 'Offen',
    close: 'Schließen',
    modify: 'Ändern',
    noOpenPositions: 'Keine offenen Positionen',
    noOrders: 'Keine {type} Aufträge',

    // Profile Screen
    account: 'Konto',
    profileInformation: 'Profilinformationen',
    profileInfoDesc: 'Ihr persönliches Konto anzeigen und verwalten',
    preference: 'Einstellung',
    preferenceDesc: 'Passen Sie das Aussehen Ihrer Trading-App an',
    security: 'Sicherheit',
    securityDesc: 'Halten Sie Ihr Trading-Konto sicher',
    connectionTest: 'Verbindungstest',
    connectionTestDesc: 'Backend-API-Verbindungen testen',
    appInfo: 'App-Info',
    appInfoDesc: 'Zugriff auf wichtige Details, Support und Rechtliches',
    logout: 'Abmelden',

    // Wallet Screen
    addFunds: 'Geld hinzufügen',
    deposit: 'Einzahlen',
    withdraw: 'Abheben',
    transactionHistory: 'Transaktionsverlauf',
    noTransactionsYet: 'Noch keine Transaktionen',
    amountToDeposit: 'Einzuzahlender Betrag',
    amountToWithdraw: 'Abzuhebender Betrag',
    remarks: 'Bemerkungen',
    optionalRemarks: 'Optionale Bemerkungen',
    enterAmount: 'Betrag eingeben',
    processing: 'Wird verarbeitet...',
    confirm: 'Bestätigen',

    // Settings
    preferences: 'Einstellungen',
    language: 'Sprache',
    themeMode: 'Themenmodus',
    marketSegment: 'Marktsegment',
    defaultOrderType: 'Standard-Auftragstyp',

    // Common
    retry: 'Wiederholen',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    cancel: 'Abbrechen',
    save: 'Speichern',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    search: 'Suchen',
    filter: 'Filtern',
    sort: 'Sortieren',
    apply: 'Anwenden',
    reset: 'Zurücksetzen',
  },
  Polish: {
    // Navigation
    welcome: 'Witamy',
    home: 'Strona główna',
    trade: 'Handel',
    wallet: 'Portfel',
    position: 'Pozycja',
    profile: 'Profil',
    market: 'Rynek',

    // Home Screen
    yourBalance: 'Twoje saldo',
    todayPnl: 'Dzisiejszy PNL',
    addFund: 'Dodaj środki',
    topGainers: 'Najlepsi zyskujący',
    topLosers: 'Najwięksi przegrani',
    mostActive: 'Najbardziej aktywni',
    favorites: 'Ulubione',
    loadingMarketData: 'Ładowanie danych rynkowych...',
    noInstrumentsFound: 'Nie znaleziono instrumentów',
    noFavoritesYet: 'Jeszcze brak ulubionych. Dodaj instrumenty do swojej listy obserwowanych.',
    loginToViewFavorites: 'Zaloguj się, aby zobaczyć swoje ulubione',
    noInstrumentsAvailable: 'Brak dostępnych instrumentów dla',

    // Trading
    buy: 'Kup',
    sell: 'Sprzedaj',
    orderBooks: 'Księgi zamówień',
    positions: 'Pozycje',
    orders: 'Zamówienia',
    ordersAndPositions: 'Zamówienia i pozycje',
    pending: 'Oczekujące',
    closed: 'Zamknięte',
    open: 'Otwarte',
    close: 'Zamknij',
    modify: 'Modyfikuj',
    noOpenPositions: 'Brak otwartych pozycji',
    noOrders: 'Brak zamówień {type}',

    // Profile Screen
    account: 'Konto',
    profileInformation: 'Informacje o profilu',
    profileInfoDesc: 'Wyświetl i zarządzaj swoim kontem osobistym',
    preference: 'Preferencje',
    preferenceDesc: 'Dostosuj wygląd swojej aplikacji handlowej',
    security: 'Bezpieczeństwo',
    securityDesc: 'Zabezpiecz swoje konto handlowe',
    connectionTest: 'Test połączenia',
    connectionTestDesc: 'Testuj połączenia API backendu',
    appInfo: 'Informacje o aplikacji',
    appInfoDesc: 'Uzyskaj dostęp do ważnych szczegółów, wsparcia i informacji prawnych',
    logout: 'Wyloguj',

    // Wallet Screen
    addFunds: 'Dodaj środki',
    deposit: 'Wpłać',
    withdraw: 'Wypłać',
    transactionHistory: 'Historia transakcji',
    noTransactionsYet: 'Jeszcze brak transakcji',
    amountToDeposit: 'Kwota do wpłaty',
    amountToWithdraw: 'Kwota do wypłaty',
    remarks: 'Uwagi',
    optionalRemarks: 'Opcjonalne uwagi',
    enterAmount: 'Wprowadź kwotę',
    processing: 'Przetwarzanie...',
    confirm: 'Potwierdź',

    // Settings
    preferences: 'Preferencje',
    language: 'Język',
    themeMode: 'Tryb motywu',
    marketSegment: 'Segment rynku',
    defaultOrderType: 'Domyślny typ zamówienia',

    // Common
    retry: 'Ponów',
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    cancel: 'Anuluj',
    save: 'Zapisz',
    edit: 'Edytuj',
    delete: 'Usuń',
    search: 'Szukaj',
    filter: 'Filtruj',
    sort: 'Sortuj',
    apply: 'Zastosuj',
    reset: 'Resetuj',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English');
  const [t, setT] = useState(translations.English);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && translations[savedLanguage]) {
        changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguage(lang);
      setT(translations[lang] || translations.English);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
