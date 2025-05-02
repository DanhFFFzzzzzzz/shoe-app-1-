import { Stack } from "expo-router";
import { useOrderUpdateSubscription } from "../../../api/subcription";


export default function OrdersLayout() {
    useOrderUpdateSubscription();
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: "Orders",
                    headerShown: false,
                }}
            />
        </Stack>
    );
}