import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsersView from '../views/UsersView';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen
        name="Users"
        component={UsersView}
        options={{ title: 'Node + Express + React Native' }}
      />
    </Stack.Navigator>
  );
}
