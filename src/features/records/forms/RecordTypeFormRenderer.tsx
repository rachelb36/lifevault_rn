import React from "react";
import { RecordType } from "@/domain/records/recordTypes";
import { Text, View } from "react-native";

export default function RecordTypeFormRenderer({
  recordType,
  value,
  onChange,
}: {
  recordType: RecordType;
  value: any;
  onChange: (next: any) => void;
}) {
  void value;
  void onChange;
  return (
    <View>
      <Text>{`Form renderer not wired yet for ${recordType}.`}</Text>
    </View>
  );
}
