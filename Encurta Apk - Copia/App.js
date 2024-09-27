import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, StyleSheet, FlatList, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import localImage from './assets/logoNova2.jpg'; // Altere o caminho conforme necessário

const Stack = createStackNavigator();
const BING_API_KEY = 'afebc8f8c45d4ed9a058b73ac3871a6d';

const HomeScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (query) {
            navigation.navigate('Results', { query });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.centeredContainer}>
                <Image source={localImage} style={styles.logoImage} />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite sua pesquisa"
                        placeholderTextColor="#aaa"
                        value={query}
                        onChangeText={setQuery}
                    />
                    <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
                        <Icon name="search" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => navigation.navigate('PrivacyPolicy')}
                style={styles.privacyButton}
            >
                <Text style={styles.privacyButtonText}>Política de Privacidade</Text>
            </TouchableOpacity>
        </View>
    );
};

const ResultScreen = ({ route, navigation }) => {
    const { query: initialQuery } = route.params;
    const [query, setQuery] = useState(initialQuery);
    const [images, setImages] = useState([]);
    const [webResults, setWebResults] = useState([]);
    const [newsResults, setNewsResults] = useState([]);
    const [videoResults, setVideoResults] = useState([]);
    const [adResults, setAdResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const fetchAds = async () => {
        try {
            const adResponse = await fetch(`https://backendeco.azurewebsites.net/ads?keyword=${encodeURIComponent(query)}`);
            const adData = await adResponse.json();
            setAdResults(adData || []);
        } catch (error) {
            console.error('Error fetching ads:', error);
        }
    };

    const fetchData = async () => {
        try {
            const responses = await Promise.all([
                fetch(`https://api.bing.microsoft.com/v7.0/images/search?q=${query}`, {
                    headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY },
                }),
                fetch(`https://api.bing.microsoft.com/v7.0/search?q=${query}`, {
                    headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY },
                }),
                fetch(`https://api.bing.microsoft.com/v7.0/news/search?q=${query}`, {
                    headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY },
                }),
                fetch(`https://api.bing.microsoft.com/v7.0/videos/search?q=${query}`, {
                    headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY },
                }),
            ]);

            const imagesData = await responses[0].json();
            const webData = await responses[1].json();
            const newsData = await responses[2].json();
            const videoData = await responses[3].json();

            setImages(imagesData.value || []);
            setWebResults(webData.webPages.value || []);
            setNewsResults(newsData.value || []);
            setVideoResults(videoData.value || []);
            fetchAds(); // Fetch ads
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, [query]);

    const handleSearch = () => {
        if (query) {
            fetchData(); // Atualiza os dados com a nova consulta
        }
    };

    const renderContent = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <FlatList
                        data={images}
                        keyExtractor={(item) => item.contentUrl}
                        renderItem={({ item }) => (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.contentUrl }} style={styles.image} />
                                <Text style={styles.resultTitle}>{item.name}</Text>
                            </View>
                        )}
                        numColumns={2}
                        contentContainerStyle={styles.imageList}
                    />
                );
            case 1:
                const combinedWebResults = [...adResults, ...webResults]; // Anúncios primeiro
                return (
                    <FlatList
                        data={combinedWebResults}
                        keyExtractor={(item) => item.url || item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.resultContainer}>
                                <Text style={styles.resultTitle}>{item.name || item.titulo}</Text>
                                <Text style={styles.resultUrl}>{item.url}</Text>
                                <Text>{item.snippet || item.descricao}</Text>
                            </View>
                        )}
                    />
                );
            case 2:
                return (
                    <FlatList
                        data={newsResults}
                        keyExtractor={(item) => item.url}
                        renderItem={({ item }) => (
                            <View style={styles.resultContainer}>
                                <Text style={styles.resultTitle}>{item.name}</Text>
                                <Text style={styles.resultUrl}>{item.url}</Text>
                                <Text>{item.description}</Text>
                            </View>
                        )}
                    />
                );
            case 3:
                return (
                    <FlatList
                        data={videoResults}
                        keyExtractor={(item) => item.contentUrl}
                        renderItem={({ item }) => (
                            <View style={styles.resultContainer}>
                                <Text style={styles.resultTitle}>{item.name}</Text>
                                <Text style={styles.resultUrl}>{item.contentUrl}</Text>
                                <Text>{item.description}</Text>
                            </View>
                        )}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <Image source={localImage} style={styles.resultImage} />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua pesquisa"
                    placeholderTextColor="#aaa"
                    value={query}
                    onChangeText={setQuery}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
                    <Icon name="search" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
                {['Imagens', 'Web', 'News', 'Vídeos'].map((label, index) => (
                    <TouchableOpacity
                        key={label}
                        onPress={() => setActiveIndex(index)}
                        style={[
                            styles.toggleButton,
                            activeIndex === index ? styles.activeButton : styles.inactiveButton
                        ]}
                    >
                        <Text style={styles.toggleButtonText}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={[renderContent()]} // Necessário para o FlatList renderizar algo
                renderItem={({ item }) => item}
                keyExtractor={() => String(activeIndex)}
            />
            <TouchableOpacity
                onPress={() => navigation.navigate('PrivacyPolicy')}
                style={styles.privacyButton}
            >
                <Text style={styles.privacyButtonText}>Política de Privacidade</Text>
            </TouchableOpacity>
        </View>
    );
};

const PrivacyPolicyScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.privacyText}>
                Esta é a política de privacidade do aplicativo. Aqui você pode ler sobre como
                suas informações são tratadas.
            </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/privacy')}>
                Leia mais sobre nossa política de privacidade aqui.
            </Text>
        </View>
    );
};

const App = () => {
    const [modalVisible, setModalVisible] = useState(true);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const checkAgreement = async () => {
            const hasAgreed = await AsyncStorage.getItem('termsAgreed');
            if (hasAgreed) {
                setAgreed(true);
                setModalVisible(false);
            }
        };
        checkAgreement();
    }, []);

    const handleAgree = async () => {
        await AsyncStorage.setItem('termsAgreed', 'true');
        setAgreed(true);
        setModalVisible(false);
    };

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: '' }} />
                <Stack.Screen name="Results" component={ResultScreen} options={{ title: '' }} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Política de Privacidade' }} />
            </Stack.Navigator>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible && !agreed}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>
                        Você aceita os termos de uso do aplicativo?
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleAgree}
                    >
                        <Text style={styles.buttonText}>Aceitar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ffffff',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: '100%',
        height: 150,
        marginVertical:-190,
        marginBottom: 20,
        borderRadius: 10,
        resizeMode: 'contain',
    },
    resultImage: {
        width: '100%',
        height: 150,
        marginBottom: 20,
        borderRadius: 10,
        resizeMode: 'contain',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'gray',
        padding: 10,
        paddingRight: 40,
        borderRadius: 25,
        color: '#000',
        height: 50,

    },
    iconButton: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius:20,
    },
    toggleButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 5,
        marginHorizontal: 5,
        borderWidth: 1,
    },
    activeButton: {
        backgroundColor: '#007BFF',
        borderColor: '#0056b3',
    },
    inactiveButton: {
        backgroundColor: '#e7e7e7',
        borderColor: '#ccc',
    },
    toggleButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    resultContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    imageContainer: {
        margin: 5,
        borderRadius: 5,
        overflow: 'hidden',
        width: '48%', // Alterando para duas colunas
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 150, // Ajustando altura para melhorar o design
        borderRadius: 5,
    },
    imageList: {
        paddingBottom: 10,
    },
    resultTitle: {
        marginTop: 5,
        fontWeight: 'bold',
    },
    resultUrl: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalText: {
        marginBottom: 20,
        color: '#fff',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    privacyText: {
        marginBottom: 20,
        textAlign: 'center',
    },
    link: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
    privacyButton: {
        marginTop: 'auto', // Posiciona o botão na parte inferior
        padding: 10,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        alignSelf: 'center', // Centraliza o botão horizontalmente
    },
    privacyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default App;
