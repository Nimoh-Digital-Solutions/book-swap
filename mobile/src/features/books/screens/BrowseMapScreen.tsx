import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Region, PROVIDER_DEFAULT, MapMarker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { BrowseStackParamList } from '@/navigation/types';
import type { Book, PaginatedResponse } from '@/types';

type Nav = NativeStackNavigationProp<BrowseStackParamList, 'BrowseMap'>;

const DEFAULT_REGION: Region = {
  latitude: 50.85,
  longitude: 4.35,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function BrowseMapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 500);
      }
      setLocationReady(true);
    })();
  }, []);

  const { data: books, isLoading } = useQuery({
    queryKey: ['browse', region.latitude, region.longitude],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<Book>>(API.browse.list, {
        params: {
          lat: region.latitude,
          lng: region.longitude,
          radius: 5000,
        },
      });
      return data.results;
    },
    enabled: locationReady,
  });

  const handleMarkerPress = useCallback(
    (bookId: string) => {
      navigation.navigate('BookDetail', { bookId });
    },
    [navigation],
  );

  const recenterMap = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Location permission required');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500,
    );
  }, [t]);

  if (!locationReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {books?.map((book) => {
          if (!book.photos?.[0]) return null;
          const coords = (book as any).location?.coordinates;
          if (!coords) return null;
          return (
            <MapMarker
              key={book.id}
              coordinate={{ latitude: coords[1], longitude: coords[0] }}
              title={book.title}
              description={book.author}
              onCalloutPress={() => handleMarkerPress(book.id)}
            />
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Ionicons name="locate" size={24} color="#2563EB" />
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recenterButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingText: { fontSize: 13, color: '#6B7280' },
});
