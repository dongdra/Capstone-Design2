//Signup2.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { API_BASE_URL } from '@env'; // .env에서 API_BASE_URL 불러오기

const styles = StyleSheet.create({
  signuppagetitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 35,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
  },
  atSymbol: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    zIndex: 100
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  successbutton: { 
    width: "45%", 
    backgroundColor: '#536ed9',
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  signuppreviousButton: {
    width: "45%", 
    backgroundColor: '#d95e53',
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default function Signup2({ onSignup, onPrevious }) {
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupname, setSignupname] = useState('');
  const [signupemail, setSignupemail] = useState(''); 
  const [emailDomain, setEmailDomain] = useState('');
  const [showPassword1, setShowPassword1] = useState(false); 
  const [showPassword2, setShowPassword2] = useState(false); 
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'gmail.com', value: 'gmail.com' },
    { label: 'kakao.com', value: 'kakao.com' },
    { label: 'naver.com', value: 'naver.com' },
    { label: 'daum.net', value: 'daum.net' },
    { label: 'example.com', value: 'example.com' }
  ]);

  const isPasswordValid = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  const handleEmailInput = (text) => {
    if (!/^[\u0000-\u007F]*$/.test(text)) {
      Alert.alert('오류', '이메일에는 한글을 사용할 수 없습니다.');
      return;
    }
    setSignupemail(text);
  };

  const handleSignup = async () => {
    if (!signupUsername || !signupPassword || !confirmPassword || !signupname || !signupemail || !emailDomain) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }
  
    if (!isPasswordValid(signupPassword)) {
      Alert.alert('오류', '비밀번호는 8자리 이상이며, 알파벳과 숫자를 포함해야 합니다.');
      return;
    }
  
    if (signupPassword !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
  
    const signupData = {
      username: signupUsername,
      password: signupPassword,
      email: `${signupemail}@${emailDomain}`,
      name: signupname
    };
  
    console.log("회원가입 전송 데이터:", JSON.stringify(signupData));
  
    try {
      const response = await fetch(`${API_BASE_URL}/user/signup.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });
  
      const data = await response.json(); // 서버로부터 받은 JSON 데이터를 'data'로 받음
  
      console.log("서버 응답 데이터:", data.StatusCode);
  
      if (data.StatusCode === 200) 
      {  // StatusCode가 200인 경우 성공 처리
        Alert.alert('성공', '회원가입에 성공하였습니다.');
        onSignup();  // 회원가입 성공 시 처리
      } 
      else
      {
        Alert.alert("회원가입 실패","회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (error) {
      console.error(error);
	   Alert.alert("회원가입 실패","회원가입에 실패했습니다. 다시 시도해 주세요.");
    }
  };
  

  return (
    <View style={styles.modalContainer}>
      <Title style={styles.signuppagetitle}>회원가입</Title>
      <TextInput
        value={signupUsername}
        onChangeText={setSignupUsername}
        style={styles.input}
        mode="outlined"
        placeholder="아이디를 입력하세요."
      />
      <TextInput
        value={signupPassword}
        secureTextEntry={!showPassword1}
        onChangeText={setSignupPassword}
        style={styles.input}
        mode="outlined"
        placeholder="비밀번호를 입력하세요."
        right={
          <TextInput.Icon
            icon={showPassword1 ? "eye-off" : "eye"} 
            onPress={() => setShowPassword1(!showPassword1)}
          />
        }
      />
      <TextInput
        value={confirmPassword}
        secureTextEntry={!showPassword2} 
        onChangeText={setConfirmPassword}
        style={styles.input}
        mode="outlined"
        placeholder="비밀번호 중복 검사"
        right={
          <TextInput.Icon
            icon={showPassword2 ? "eye-off" : "eye"} 
            onPress={() => setShowPassword2(!showPassword2)}
          />
        }
      />
      <TextInput
        value={signupname} 
        onChangeText={setSignupname}
        style={styles.input}
        mode="outlined"
        placeholder="이름을 입력하세요."
      />
      
      <View style={styles.emailContainer}>
        <TextInput
          value={signupemail}
          onChangeText={handleEmailInput}
          style={styles.emailInput}
          mode="outlined"
          placeholder="이메일 아이디"
        />
        <Text style={styles.atSymbol}>@</Text>
        <DropDownPicker
          open={open}
          value={emailDomain}
          items={items}
          setOpen={setOpen}
          setValue={setEmailDomain}
          setItems={setItems}
          placeholder="이메일 선택"
          containerStyle={styles.dropdownButton}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={onPrevious} style={styles.signuppreviousButton}>
          이전
        </Button>
        <Button mode="contained" onPress={handleSignup} style={styles.successbutton}>
          회원가입 완료
        </Button>
      </View>
    </View>
  );
}

