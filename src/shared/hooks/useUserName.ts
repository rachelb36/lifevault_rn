import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getLocalUser } from "@/shared/utils/localStorage";

export function useUserName() {
  const [displayName, setDisplayName] = useState("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const user = await getLocalUser();
        if (user) {
          setDisplayName(user.preferredName || user.firstName || "");
        }
      })();
    }, []),
  );

  return { displayName };
}
