import React, { Component } from 'react';
import { StyleSheet, View, SafeAreaView, Dimensions, ScrollView, ImageBackground } from 'react-native';
import Firebase from "../../components/Firebase";
import { Text, NavHeaderWithButton, Theme, Button } from "../../components";
import * as DocumentPicker from 'expo-document-picker';
import PDFReader from 'rn-pdf-reader-js';
import _, { constant } from 'lodash';
 
export default class ViewDocuments extends Component<> {
 
    constructor(props) {
        super(props);
 
        this.state = {
            imagePath: require("../../../assets/PetCare.png"),
            pdfs: []
        }

        navigation = this.props.navigation;
        uid = navigation.state.params.uid;
        pet_uid = navigation.state.params.pet_uid;

        this.fillArrayWithFiles();
    }
 
    //Opens DocumentPicker and waits for user to select one
    chooseFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
 
        if (result.type == "cancel") {
            console.log("canceled");
        }
        else {
            let path = result.uri;
            let documentName = this.getFileName(result.name, path);
            this.setState({ imagePath: path });
            this.uploadDocument(path, documentName);
        }
    }
 
    //For Firebase Storage purposes
    getFileName(name, path) {
        if (name != null) { return name; }
 
        if (Platform.OS === "ios") {
            path = "~" + path.substring(path.indexOf("/Documents"));
        }
        return path.split("/").pop();
    }
 
    uploadDocument = async (path, documentName) => {
        const response = await fetch(path);
        const blob = await response.blob();
        var date = new Date().toISOString().replaceAll(":", "-");

        /**this is one point of failure, if pdf name has special characters that may not translate well in Firebase
        then it can cause some issues when deleting but otherwise there should be no issues
        maybe state that pdf name must be something simple with no special characters */
        
        var ref = Firebase.storage.ref().child("labResults/" + documentName + date);
        let task = ref.put(blob);
        let docRef = Firebase.firestore.collection("users").doc(uid).collection("pets").doc(pet_uid);
 
        let labResultFiles = [];
 
        //Populate array with current labResults field of user
        docRef.get().then(doc => {
            if (doc.data().labResults) {
                (doc.data().labResults).forEach((field) => {
                    labResultFiles.push(field)
                });
            }
        })
        .then(() => {
            task.then(() => {
                //Add new file to the local array, the user field, and Firebase Storage
                ref.getDownloadURL().then((pdf) => {
                    labResultFiles.push(pdf);
 
                    Firebase.firestore
                        .collection("users")
                        .doc(uid)
                        .collection("pets")
                        .doc(pet_uid)
                        .update({ labResults: labResultFiles })
                        .then(() => {this.fillArrayWithFiles()})
                });
            })
            .catch((e) => {
                console.log('uploading document error => ', e);
            });
        });
    }
 
    //Retrieves user labResults files and sets state
    fillArrayWithFiles() {
        let docRef = Firebase.firestore.collection("users").doc(uid).collection("pets").doc(pet_uid);
        let array = [];
 
        docRef.get().then(doc => {
            if (doc.data().labResults) {
                (doc.data().labResults).forEach((field) => {
                    array.push(field)
                });
            }
        })
            .then(() => {
                this.setState({
                    pdfs: array
                })
            });
    }
 
    //Populates the views array with view tags that have PDFReaders to display in render
    renderPdfViewer = () => {
        var views = [];
 
        for (let i = 0; i < (this.state.pdfs).length; i++) {
            views.push(
                <View style={{ zIndex: 100 }} key={(i + 1).toString()}>
                    <View style={styles.pdfReader}>
                        <PDFReader
                            source={{
                                uri: this.state.pdfs[i],
                            }}
                        />
                    </View>
                </View>
            )
        }
 
        return (
            <>
                {views}
            </>
        )
    }
 
    render() {
        const { navigation } = this.props;
 
        return (
            <ImageBackground source={require('../../../assets/pattern.png')} style={styles.container}>
                <NavHeaderWithButton title="Lab Results" buttonIcon="plus" buttonFn={this.chooseFile} back backFn={() => this.props.navigation.goBack()} {...{ navigation }}/>
                
                <ScrollView>
                    {this.renderPdfViewer()}
                </ScrollView>
            </ImageBackground>
        )
    }
}
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pdfReader: {
        height: 500,
        justifyContent: "space-around",
        margin: Theme.spacing.base
    }
});