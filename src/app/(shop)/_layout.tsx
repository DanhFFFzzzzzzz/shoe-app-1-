import { Redirect, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, StyleSheet } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../providers/auth-provider";


function TabBarIcon(props: { 
    name: React.ComponentProps<typeof FontAwesome> ['name'];
    color: string;
}) {
    return <FontAwesome  size={24} {... props} style ={{color : '#1BC464'}} />;
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
                                tabBarIcon: (props: React.ComponentProps<typeof FontAwesome>) => {
                                    return <TabBarIcon {...props} name='shopping-cart' color="#1BC464" />
                                } 
                            }} 
                        />
                <Tabs.Screen 
                name="orders" 
                options={{
                    title: 'Orders',
                    tabBarIcon: (props: React.ComponentProps<typeof FontAwesome>) => {
                        return <TabBarIcon {...props} name='book' color="#1BC464" />
                    }
                  }} 
            />
            <Tabs.Screen
              name="search/index"
              options={{
                title: 'Search',
                tabBarIcon: (props: React.ComponentProps<typeof FontAwesome>) => {
                  return <TabBarIcon {...props} name='search' color="#1BC464" />
                }
              }}
            />
            <Tabs.Screen
              name="account/index"
              options={{
                title: 'Account',
                tabBarIcon: (props: React.ComponentProps<typeof FontAwesome>) => {
                  return <TabBarIcon {...props} name='user' color="#1BC464" />
                }
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