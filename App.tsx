import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SectionList,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo'; // For checking internet status
import AsyncStorage from '@react-native-async-storage/async-storage'; // For offline storage
import FastImage from 'react-native-fast-image'; // Import FastImage for caching images

const {width} = Dimensions.get('window');
const PAGE_SIZE = 3; // Number of sections to load per pagination step
const SPACING_IMAGE = 10;

const App = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check internet connection
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          setIsOffline(true);
          const cachedData = await AsyncStorage.getItem('cachedSections');
          if (cachedData) {
            setSections(JSON.parse(cachedData));
          }
          return;
        }

        // Fetch data from API
        const response = await fetch(
          'https://mocki.io/v1/28ef2abb-113c-4868-ab0c-ca94e0694d03',
        );
        const data = await response.json();

        const formattedData = Object.keys(data)
            .map(key => {
              const value = data[key];

              // Check if value is an array and has data inside
              if (Array.isArray(value) && value.length > 0) {
                return {
                  title: key,
                  data: [data[key]], // Use the original array if it's not empty
                };
              }
              return null; // If the array is empty or not valid, return null
            })
            .filter(item => item !== null);

        // Save data for offline use
        await AsyncStorage.setItem(
          'cachedSections',
          JSON.stringify(formattedData),
        );

        setSections(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderGrid = items => {
    if (!Array.isArray(items)) {
      return null;
    }
    if (items.length > 4) {
      return (
        <FlatList
          data={items}
          keyExtractor={item => item?.id?.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <FastImage
              source={{uri: item.url}}
              style={styles.imageSmall}
              resizeMode={FastImage.resizeMode.cover} // Resize mode for FastImage
            />
          )}
        />
      );
    } else if (items.length % 2 === 0) {
      return (
        <View style={styles.row}>
          {items.map(item => (
            <FastImage
              key={item.id}
              source={{uri: item.url}}
              style={styles.imageHalf}
              resizeMode={FastImage.resizeMode.cover}
            />
          ))}
        </View>
      );
    } else if (items.length <= 3) {
      return (
        <View>
          <FastImage
            source={{uri: items[0].url}}
            style={styles.imageFull}
            resizeMode={FastImage.resizeMode.cover}
          />
          {items.length > 1 && (
            <View style={styles.row}>
              {items.slice(1).map(item => (
                <FastImage
                  key={item.id}
                  source={{uri: item.url}}
                  style={styles.imageHalf}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ))}
            </View>
          )}
        </View>
      );
    }
  };

  // Pagination: Load data in chunks
  const paginatedData = sections.slice(0, page * PAGE_SIZE);

  const loadMoreData = () => {
    if (page * PAGE_SIZE < sections.length) {
      setPage(prevPage => prevPage + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {isOffline && (
          <Text style={styles.offlineText}>
            Offline Mode - Showing Cached Data
          </Text>
        )}
        <SectionList
          sections={paginatedData}
          keyExtractor={(item, index) => index.toString()}
          renderSectionHeader={({section: {title}}) => (
            <Text style={styles.sectionHeader}>
              {title === 'title' ? '' : title}
            </Text>
          )}
          renderItem={({item}) => renderGrid(item)}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10, backgroundColor: '#fff'},
  sectionHeader: {fontSize: 18, fontWeight: 'bold', marginVertical: 10},
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageFull: {
    width: width - SPACING_IMAGE * 2,
    height: width - SPACING_IMAGE * 2,
    marginBottom: SPACING_IMAGE,
    borderRadius: SPACING_IMAGE,
  },
  imageHalf: {
    width: (width - SPACING_IMAGE * 3) / 2,
    height: (width - SPACING_IMAGE * 3) / 2,
    marginBottom: SPACING_IMAGE,
    borderRadius: SPACING_IMAGE,
  },
  imageSmall: {
    width: (width - SPACING_IMAGE * 3) / 2,
    height: (width - SPACING_IMAGE * 3) / 2,
    marginRight: SPACING_IMAGE,
    borderRadius: SPACING_IMAGE,
  },
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  offlineText: {color: 'red', textAlign: 'center', marginBottom: 10},
});

export default App;
