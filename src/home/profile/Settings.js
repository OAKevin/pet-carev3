// @flow
import autobind from "autobind-decorator";
import * as React from "react";
import { Alert, StyleSheet, View, TouchableWithoutFeedback, Image, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Content } from "native-base";
import { Feather as Icon } from "@expo/vector-icons";
import * as Permissions from "expo-permissions";

import {
    NavHeader,
    Firebase,
    Button,
    Text,
    TextField,
    Theme,
    serializeException,
    RefreshIndicator,
    NavHeaderWithButton,
} from "../../components";

import EnableCameraRollPermission from "./EnableCameraRollPermission";

var height = Dimensions.get("window").height;

export default class Settings extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            name: "",
            pic: "",
            loading: false,
            hasCameraRollPermission: null,
            address: "",
        };

        navigation = this.props.navigation;
        profile = navigation.state.params.profile;

        this.state.name = profile.name;
        this.state.pic = profile.pic ? profile.pic : profile.picture.uri;
        this.state.address = profile.address;

        Permissions.askAsync(Permissions.CAMERA_ROLL)
        .then((stat) => {
            this.setState({hasCameraRollPermission: stat.status === "granted"})
        })
    }

    @autobind
    async save(): Promise<void> {
        const originalProfile = profile;
        const { name, pic, address } = this.state;
        const { uid } = Firebase.auth.currentUser;

        this.setState({ loading: true });

        try {
            if (name !== originalProfile.name) {
                await Firebase.firestore.collection("users").doc(uid).update({ name })
                .then(() => {
                    this.props.navigation.state.params.onSubmit();
                    this.props.navigation.goBack()
                });
            }
            if (address !== originalProfile.address) {
                await Firebase.firestore.collection("users").doc(uid).update({ address })
                .then(() => {
                    this.props.navigation.state.params.onSubmit();
                    this.props.navigation.goBack()
                });
            }
            if (pic !== originalProfile.pic) {

                var img = originalProfile.pic
                if(img != Theme.links.defaultProfile)
                {
                    var oldImageName = img.substring(img.indexOf("profilePictures%2F")+ 18, img.indexOf("?alt=media"))
                    Firebase.storage.ref().child("profilePictures/" + oldImageName).delete();
                }

                let imageName = pic.split("/").pop();
                const response = await fetch(pic);
                const blob = await response.blob();

                await Firebase.storage.ref().child("profilePictures/" + imageName).put(blob)
                .then(() => {
                    Firebase.storage.ref().child("profilePictures/" + imageName).getDownloadURL()
                    .then((pic) => {
                        Firebase.firestore
                            .collection("users")
                            .doc(uid)
                            .update({pic})
                            .then(() => {
                                this.props.navigation.state.params.onSubmit();
                                this.props.navigation.goBack()
                            })
                    });
                }).catch((e) => {
                    console.log('uploading image error => ', e);
                });
            }
        } catch (e) {
            alert(serializeException(e));
            this.setState({ loading: false });
        }
    }

    @autobind
    async setPicture(): Promise<void> {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (result.cancelled === false) {
            let path = result.uri;
            this.setState({ pic: path });
        }
    }

    @autobind
    async deleteUser(): Promise<void> {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? You cannot undo this action.",
            [
                {
                    text: "Cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const user = Firebase.auth.currentUser;
                        var defaultPic = Theme.links.defaultProfile;
                        
                        await Firebase.firestore.collection("users").doc(user.uid).collection("pets").get()
                        .then(pets => {
                            pets.forEach(async (pet) => {

                                var ref = Firebase.firestore.collection("users").doc(user.uid).collection("pets").doc(pet.id);
                                var petpic = pet.data().pic;

                                if(petpic != "null")
                                {
                                    var imageName = petpic.substring(petpic.indexOf("petPictures%2F") + 14, petpic.indexOf("?alt=media"))
                                    Firebase.storage.ref().child("petPictures/" + imageName).delete();
                                }

                                //check for lab results
                                if(pet.data().labResults)
                                {
                                    pet.data().labResults.forEach((pdf) => 
                                    {
                                        var pdfName = pdf.substring(pdf.indexOf("labResults%2F") + 13, pdf.indexOf("?alt=media"));
                                        Firebase.storage.ref().child("labResults/" + pdfName ).delete().catch((error) => {console.log(error)});
                                    })
                                }

                                //check for prescriptions
                                await ref.collection("prescriptions").get()
                                .then((docs) => 
                                {
                                    docs.forEach((data) => 
                                    {
                                        ref.collection("prescriptions").doc(data.id).delete();
                                    })
                                })

                                //check for diet
                                await ref.collection("diet").get()
                                .then((docs) => 
                                {
                                    docs.forEach((data) => 
                                    {
                                        ref.collection("diet").doc(data.id).delete();
                                    })
                                })

                                //check for dietU
                                await ref.collection("dietU").get()
                                .then((docs) => 
                                {
                                    docs.forEach((data) => 
                                    {
                                        ref.collection("dietU").doc(data.id).delete();
                                    })
                                })

                                //delete pet
                                ref.delete().catch((error) => {
                                    console.error("Error deleting pet: ", error);
                                });
                            })
                        })

                        const pic = profile.pic

                        if(pic != defaultPic)
                        {
                            var imageName = pic.substring(pic.indexOf("profilePictures%2F") + 18, pic.indexOf("?alt=media"))
                            Firebase.storage.ref().child("profilePictures/" + imageName).delete();
                        }
                    
                        Firebase.firestore.collection("users").doc(user.uid).delete().then(() => {
                            user.delete().catch((error) => {
                                console.error("Error deleting account: ", error);
                            });
                        }).catch((error) => {
                            console.error("Error removing document: ", error);
                        });

                        this.props.navigation.navigate("Welcome");
                    },
                },
            ]
        );
    }

    @autobind
    setName(name: string) {
        this.setState({ name });
    }

    @autobind
    setAddress(address: string) {
        this.setState({ address });
    }

    render(): React.Node {
        const { loading } = this.state;
        if (this.state.hasCameraRollPermission === null) {
            return (
                <View style={styles.refreshContainer}>
                    <View style={{
                        paddingTop: height/2,
                        justifyContent:"center",
                    }}>
                        <RefreshIndicator refreshing />
          </View>
                </View>
            );
        } 
        else if (this.state.hasCameraRollPermission === false) {
            return <EnableCameraRollPermission />;
        }
        return (
            <View style={styles.container}>
                <NavHeaderWithButton 
                    title="Settings" 
                    back backFn={() => this.props.navigation.goBack()} {...{ navigation }} 
                    buttonFn={this.save} buttonName="Save"
                />
                <Content style={styles.content}>
                    <View style={styles.avatarContainer}>
                        <TouchableWithoutFeedback onPress={this.setPicture}>
                            <View style={styles.avatar}>
                                <Image style={styles.profilePic} source={{ uri: this.state.pic }} />
                                <Icon name="camera" size={25} color="white" style={styles.editIcon} />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                    <Text style={styles.header}>Name</Text>
                    <TextField
                        placeholder="Name"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="go"
                        defaultValue={this.state.name}
                        onSubmitEditing={this.save}
                        onChangeText={this.setName}
                        style={styles.textField}
                    />
                    <View style={styles.separator}/>
                    <Text style={styles.header}>Address</Text>
                    <TextField
                        placeholder="Address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="go"
                        defaultValue={this.state.address}
                        onSubmitEditing={this.save}
                        onChangeText={this.setAddress}
                        style={styles.textField}
                    />
                    <View style={styles.separator}/>
                    <View style={{paddingTop: 12}}></View>
                    <Button label="Sign Out" full onPress={logout} style="base" textColor={Theme.palette.danger}/>
                    <View style={{marginTop:-8}}><Button label="Delete Account" full onPress={this.deleteUser} style="base" textColor={Theme.palette.danger}/></View>
                </Content>
            </View>
        );
    }
}

const logout = () => Firebase.auth.signOut();
const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
    },
    content: {
        marginHorizontal: Theme.spacing.base,
    },
    refreshContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarContainer: {
        alignItems: "center",
    },
    avatar: {
        marginVertical: Theme.spacing.base,
        alignItems: "center",
        height: 100,
        width: 100,
    },
    profilePic: {
        position: "absolute",
        top: 0,
        left: 0,
        height: 100,
        width: 100,
        resizeMode: "cover",
        borderRadius: 50,
    },
    editIcon: {
        position: "absolute",
        top: 50 - 12.5,
        left: 50 - 12.5,
    },
    separator: {
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        alignSelf: 'flex-start',
        width: '100%',
        marginBottom: 20,
    },
    header: {
        fontWeight: "900",
        color: "black",
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 4,
    },
    informationContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
        marginTop: 8,
        marginBottom: 8,
    },
    textField: {
        marginLeft: 4,
        width: "100%",
    },
});
