import React from 'react'
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  separatorOffset: {
    flex: 2,
    flexDirection: 'row',
  },
  separator: {
    borderColor: '#EDEDED',
    borderWidth: 1,
    flex: 8,
    flexDirection: 'row',
  },
})

const Separator = () => (
  <View style={styles.container}>
    <View style={styles.separator} />
  </View>
)

export default Separator
