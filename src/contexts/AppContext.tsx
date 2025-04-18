
import { ReactNode } from "react";
import { UserProvider } from "./UserContext";
import { ChoreProvider } from "./ChoreContext";
import { RewardProvider } from "./RewardContext";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <UserProvider>
      <ChoreProvider>
        <RewardProvider>{children}</RewardProvider>
      </ChoreProvider>
    </UserProvider>
  );
}
