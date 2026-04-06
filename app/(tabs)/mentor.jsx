import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Mentor = () => {
  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Hier wird der KI-Mentor entstehen</Text>
      </View>  
    </View>  
  )
}

export default Mentor

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  container: {
      flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 50,
    },
    title: {
      fontSize: 30,
      textAlign: 'center',
    },
})