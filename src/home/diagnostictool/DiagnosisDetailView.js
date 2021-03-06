import Firebase from "../../components/Firebase";
import React, { Component } from 'react'
import type { ScreenParams } from "../../components/Types";
import { NavHeader, RefreshIndicator } from "../../components";
import { Card } from 'react-native-elements'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  Dimensions
} from 'react-native'
import {Text, Theme} from "../../components";

var height = Dimensions.get('window').height;

export default class DiagnosisDetailView extends Component {
  constructor(props)
  {
    super(props);
    this.state = {
        description: [],
        symptoms: [],
        stageOne: [],
        stageTwo: [],
        treatments: [],
        prevention: []
    };

    diagnosisName = this.props.navigation.state.params.diagnosisName;

    Firebase.firestore
    .collection("diseaseDetails")
    .doc(diagnosisName)
    .get()
    .then(doc => {
        this.setState({
            description: doc.data().description, 
            symptoms: doc.data().symptoms,
            stageOne: doc.data().stageOne,
            stageTwo: doc.data().stageTwo,
            treatments: doc.data().treatments,
            prevention: doc.data().prevention,
        });
    });
  }

  renderDetail = (stateParameter, heading) => {
    index = 0;
    return(
      <>
        {stateParameter.length > 0 && 
        <View>
          <View style={styles.separator} />
          <Text style={Theme.typography.header3}>{heading}</Text>
          <View style={styles.separator} />
          <Text />
          <View>
          {stateParameter.map(data => (
            <Text key={index++} style={styles.diagnosisResultsText}>• { data }</Text>
          ))}
          </View>
          <Text />
        </View>
        }
      </>
    )
}

  render():React.Node {
    const { navigation } = this.props;

    if(this.state.loading)
    {
      return(
        <ScrollView style={[styles.container]}>
          <View style={{
            paddingTop: height/2,
            justifyContent:"center",
          }}>
            <RefreshIndicator refreshing />
          </View>
        </ScrollView>
      )
    }
    else {
    return (
      <>
      <NavHeader title={diagnosisName} back backFn={() => this.props.navigation.goBack()} {...{ navigation }}/>
      <ScrollView persistentScrollbar={false} >
        <View style={styles.container}>
          <Card containerStyle={styles.cardContainer}>
            {this.renderDetail(this.state.description, "Description")}
            {this.renderDetail(this.state.symptoms, "Symptoms")}
            {this.renderDetail(this.state.stageOne, "Stage One")}
            {this.renderDetail(this.state.stageTwo, "Stage Two")}
            {this.renderDetail(this.state.treatments, "Treatments")}
            {this.renderDetail(this.state.prevention, "Prevention")}
          </Card>
        </View>
      </ScrollView>
      </>
    )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1,
    margin: 0,
    padding: Theme.spacing.base
  },
  diagnosisResultsText: {
    marginHorizontal: Theme.spacing.tiny,
    marginBottom: Theme.spacing.tiny
  },
  separator: {
    borderColor: Theme.palette.black,
    borderWidth: 0.8,
    flex: 8,
    flexDirection: "row"
  },
})

