import { Stack} from "expo-router";
import { ToastProvider } from "react-native-toast-notifications";
import Auth from "./auth";
import AuthProvider from "../providers/auth-provider";
import QueryProvider from "../providers/query-provider";
import { useCartStoreHydration } from "../store/cart-store";

export default function RootLayout(){
  useCartStoreHydration();
  return(
    <ToastProvider>
        <AuthProvider>
            <QueryProvider>
            <Stack>
        <Stack.Screen 
            name='(shop)' 
            options={{ headerShown: false, title: 'Shop' }} 
        />
        <Stack.Screen 
            name='categories' 
            options={{ headerShown: false, title: 'Categories' }} 
        />
        <Stack.Screen 
            name='product' 
            options={{ headerShown: false, title: 'Product' }} 
        />
        <Stack.Screen 
            name='cart' 
            options={{ presentation: 'modal' , title: 'Shopping Cart' }} 
        />
        <Stack.Screen 
            name="auth" 
            options={{ headerShown: false, title: "Auth" }} 
        />
    </Stack>
            </QueryProvider>
        </AuthProvider>
    </ToastProvider>
    );
}