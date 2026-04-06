import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Feedback = () => {
  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Hier wird unsere Feedback Seite entstehen</Text>
      </View>  
    </View>  
  )
}

export default Feedback

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
    },
    title: {
      fontSize: 30,
      textAlign: 'center',
      margin: 50,
    },
})