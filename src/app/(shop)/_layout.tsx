import { Redirect, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/auth-provider";

function TabBarIcon({ name, color, focused }: { name: React.ComponentProps<typeof FontAwesome>['name'], color: string, focused: boolean }) {
    return <FontAwesome size={24} name={name} color={color} style={{ opacity: focused ? 1 : 0.7 }} />;
}

const TabsLayout = () => {
    const { session, mounting } = useAuth();

    if(mounting) return <ActivityIndicator />;
    if(!session) return <Redirect href = '/auth' />;

    return(
        <SafeAreaView edges = {['top']} style ={styles.safeArea}>
            <Tabs 
            screenOptions ={{
                tabBarActiveTintColor: '#1BC464',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: { fontSize: 16 },
                tabBarStyle: { 
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20, 
                    paddingTop: 10, 
                },
                headerShown: false,
            }}
            >
                <Tabs.Screen 
                    name='index' 
                    options={{ 
                        title: 'Shop',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name='shopping-cart' color={color} focused={focused} />
                        )
                    }} 
                />
                <Tabs.Screen 
                    name="orders" 
                    options={{
                        title: 'Orders',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name='book' color={color} focused={focused} />
                        )
                    }} 
                />
                <Tabs.Screen
                    name="search/index"
                    options={{
                        title: 'Search',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name='search' color={color} focused={focused} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="favorite-products/index"
                    options={{
                        title: 'Favorite',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name='heart' color={color} focused={focused} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="account/index"
                    options={{
                        title: 'Account',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name='user' color={color} focused={focused} />
                        )
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
};

export default TabsLayout;

const styles = StyleSheet.create({
    safeArea: {
        flex: 0.98,
        backgroundColor: 'white',
    },
});