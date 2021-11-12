import React, { Component } from 'react';
import {StyleSheet, View, FlatList, SafeAreaView, ActivityIndicator, Dimensions} from 'react-native';
import DiagnosisItem from './DiagnosisItem';
import _ from 'lodash';
import Firebase from "../../components/Firebase";
import { NavHeader, Text } from "../../components";

export default class DiagnosticToolResults extends Component {

  constructor(props){
     super(props);
      this.state = {
        items: [],
        loading: true,
      };

      const { uid } = Firebase.auth.currentUser;

      let diagnosedDiseases;

      diagnosedDiseases = this.props.navigation.state.params.diagnoses.map((str, index) => ({ name: str, id: index + 1}));
      this.state.items = diagnosedDiseases;
      this.state.loading = false;
    }

    //create each list item
  _renderItem = ({item}) => {
    const { navigation } = this.props;
    return (<DiagnosisItem index={item.id}
        name={item.name}
        {...{navigation}}
      />)
    };

  //map to some id. We use the "id" attribute of each item in our list created in our MockPersonList
  _keyExtractor = (item, index) => item.id.toString();

  render() {
    const { navigation } = this.props;

    if(this.state.loading)
    {
        return(
        <SafeAreaView style={[styles.container]}>
        <View style={{
            paddingTop: "40%",
            justifyContent:"center",
        }}>
            <ActivityIndicator size="large" />
        </View>
        </SafeAreaView>
        )
    }
    return (
      <View style={[styles.container]}>
      <NavHeader title="Diagnosed Diseases" back backFn={() => this.props.navigation.goBack()} {...{ navigation }}/>
        
          <FlatList
            data={this.state.items}
            ref={r=>this.refs=r}//create refrence point to enable scrolling
            keyExtractor={this._keyExtractor}//map your keys to whatever unique ids the have (mine is a "id" prop)
            renderItem={this._renderItem}//render each item
          />
          {(this.state.items).length < 1 && <Text style={styles.noItemsMessage}>No diseases found. Please contact your veterinarian.</Text>}
        </View>
      )
  }
};

const {height} = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  noItemsMessage: {
    zIndex: 1000,
    bottom: height/2,
    alignSelf: "center",
    textAlign: "center",
    fontSize: 21
  }
});