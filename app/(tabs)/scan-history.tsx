import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { Card, Chip, Divider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { getScanHistory, type ProductDetails } from '../../services/productService';

export default function ScanHistoryScreen() {
  const { t } = useLanguage();
  const { theme, isDarkTheme } = useTheme();
  const { user } = useAuth();

  const [scanHistory, setScanHistory] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScanHistory();
  }, [user]);

  const loadScanHistory = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const history = await getScanHistory(user.uid);
      setScanHistory(history);
    } catch (error) {
      console.error('Error loading scan history:', error);
      setError('Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: ProductDetails }) => {
    return (
      <Card style={styles.card}>
        {item.imageUri && (
          <Card.Cover source={{ uri: item.imageUri }} style={styles.productImage} />
        )}
        
        <Card.Title
          title={item.recallInfo.productName}
          subtitle={formatDate(item.scanDate)}
          titleStyle={{ fontWeight: 'bold' }}
        />
        
        <Card.Content>
          <Chip
            style={[
              styles.recallChip,
              {
                backgroundColor: item.recallInfo.isRecalled
                  ? '#FF3B30'
                  : '#34C759',
              },
            ]}
            textStyle={{ color: 'white', fontWeight: 'bold' }}
          >
            {item.recallInfo.isRecalled ? t('recalled') : t('notRecalled')}
          </Chip>
          
          {item.recallInfo.isRecalled && (
            <View style={styles.recallDetails}>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                {t('recallReason')}:
              </Text>
              <Text style={{ color: theme.colors.text, marginBottom: 10 }}>
                {item.recallInfo.recallReason}
              </Text>
              
              <Divider style={styles.divider} />
              
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                {t('manufacturer')}:
              </Text>
              <Text style={{ color: theme.colors.text }}>
                {item.recallInfo.manufacturer}
              </Text>
            </View>
          )}
          
          {item.nutritionalInfo && (
            <View style={styles.nutritionSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('nutritionalInfo')}
              </Text>
              
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                  {t('calories')}:
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  {item.nutritionalInfo.calories}
                </Text>
              </View>
              
              <View style={styles.nutritionRow}>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>
                  {t('proteins')}:
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  {item.nutritionalInfo.proteins}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
          Please log in to view your scan history
        </Text>
      </View>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
        <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
          No scan history found. Start scanning products to build your history.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <FlatList
        data={scanHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.recallInfo.productName}-${index}`}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  productImage: {
    height: 150,
  },
  recallChip: {
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  recallDetails: {
    marginTop: 15,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  divider: {
    marginVertical: 10,
  },
  nutritionSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nutritionLabel: {
    fontWeight: 'bold',
  },
}); 