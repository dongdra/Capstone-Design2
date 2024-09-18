// LoginPage.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import SignupModal from '../Modal/SignupModal'; // 회원가입 모달 가져오기

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 10,
  },
  loginbutton: {
    marginVertical: 10,
    backgroundColor:'#536ed9',
  },
  signupbutton:{
    marginVertical: 10,
    backgroundColor:'#53d970',
  }

});

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signupModalVisible, setSignupModalVisible] = useState(false); // 회원가입 모달 상태

  const handleLogin = () => {
    if (username && password) {
      onLogin(); // 로그인 성공 시 Home으로 이동
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="아이디"
        mode="outlined"
        value={username}
        onChangeText={text => setUsername(text)}
        style={styles.input}
      />
      <TextInput
        label="비밀번호"
        mode="outlined"
        value={password}
        secureTextEntry
        onChangeText={text => setPassword(text)}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.loginbutton}>
        로그인
      </Button>
      <Button mode="contained" onPress={() => setSignupModalVisible(true)} style={styles.signupbutton}>
        회원가입
      </Button>

      {/* 회원가입 모달 표시 */}
      <SignupModal
        visible={signupModalVisible}
        onDismiss={() => setSignupModalVisible(false)}
        onSignup={() => {
          setSignupModalVisible(false);
          alert('회원가입 성공');
        }}
      />
    </View>
  );
}


