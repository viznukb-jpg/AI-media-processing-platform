import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { JobEvent } from '../types';
import { JobTimelineItem } from './JobTimelineItem';

type Props = {
  events: JobEvent[];
};

export const JobTimeline = ({ events }: Props) => {
  return (
    <View>
      <Text style={styles.title}>Timeline</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <JobTimelineItem item={item} isLast={index === events.length - 1} />
        )}
        contentContainerStyle={styles.list}
        scrollEnabled={false} // since it will likely be inside a scrollview or have limited height
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});
