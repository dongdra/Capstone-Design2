// SignupModal.js
import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TextInput, Button, Modal, Portal, Title } from 'react-native-paper';

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 5,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  signuppagetitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#F7F7F7',
  },
  button: {
    width: '100%',
    marginTop: 10,
    backgroundColor:'#536ed9',
    paddingVertical: 5,
  },
  cancelButton: {
    width: '100%',
    marginTop: 10,
    backgroundColor:'#d95e53',
    paddingVertical: 5,
  },
});

export default function SignupModal({ visible, onDismiss, onSignup }) {
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    dob: '',
    signupUsername: '',
    signupPassword: ''
  });

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.header}>
          <Title style={styles.signuppagetitle}>회원가입</Title>
        </View>
        <TextInput
          label="이름"
          value={signupInfo.name}
          onChangeText={text => setSignupInfo({ ...signupInfo, name: text })}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="생년월일"
          value={signupInfo.dob}
          onChangeText={text => setSignupInfo({ ...signupInfo, dob: text })}
          style={styles.input}
          mode="outlined"
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          label="아이디"
          value={signupInfo.signupUsername}
          onChangeText={text => setSignupInfo({ ...signupInfo, signupUsername: text })}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="비밀번호"
          value={signupInfo.signupPassword}
          secureTextEntry
          onChangeText={text => setSignupInfo({ ...signupInfo, signupPassword: text })}
          style={styles.input}
          mode="outlined"
        />
        <Button mode="contained" onPress={onSignup} style={styles.button}>
          회원가입
        </Button>
        <Button mode="contained" onPress={onDismiss} style={styles.cancelButton}>
          취소
        </Button>
      </Modal>
    </Portal>
  );
}


