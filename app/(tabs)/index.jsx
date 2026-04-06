import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Home = () => {
  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>GROW</Text>
      </View>  
    </View>  
  )
}

export default Home

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
      fontSize: 40,
      textAlign: 'center',
    },
})