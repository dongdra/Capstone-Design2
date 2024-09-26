import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';

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

export default function Signup2({ signupInfo, setSignupInfo, onSignup, onPrevious }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupemail, setSignupemail] = useState(''); // signupemail은 signupInfo와 연동하지 않음
  const [emailDomain, setEmailDomain] = useState('');
  const [showPassword1, setShowPassword1] = useState(false); 
  const [showPassword2, setShowPassword2] = useState(false); 
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'gmail.com', value: 'gmail.com' },
    { label: 'nate.com', value: 'nate.com' },
    { label: 'naver.com', value: 'naver.com' },
  ]);

  const isPasswordValid = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  const handleEmailInput = (text) => {
    // 한글이 포함된 경우 경고 메시지를 출력하고 입력을 무시
    if (!/^[\u0000-\u007F]*$/.test(text)) {
      Alert.alert('오류', '이메일에는 한글을 사용할 수 없습니다.');
      return;
    }
    setSignupemail(text);
    updateEmail(text, emailDomain); // 이메일 변경 시 fullEmail 업데이트
  };

   // 이메일과 도메인이 변경될 때마다 fullEmail을 업데이트
   const updateEmail = (email, domain) => {
    const fullEmail = email && domain ? `${email}@${domain}` : '';
    setSignupInfo({ ...signupInfo, fullEmail });
  };

  const handleSignup = async () => {
    
    if (!signupInfo.signupUsername || !signupInfo.signupPassword || !confirmPassword || !signupInfo.signupname || !signupemail || !emailDomain) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (!isPasswordValid(signupInfo.signupPassword)) {
      Alert.alert('오류', '비밀번호는 8자리 이상이며, 알파벳과 숫자를 포함해야 합니다.');
      return;
    }

    if (signupInfo.signupPassword !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('/signup.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signupInfo.signupUsername,
          password: signupInfo.signupPassword,
          email: signupInfo.fullEmail, // 완성된 이메일을 전달
          name: signupInfo.signupname,
        }),
      });

      const result = await response.json();

      if (result.StatusCode === 200 && result.message === "Sign up successfully") {
        Alert.alert('성공', '회원가입에 성공하였습니다.');
        onSignup();
      } else {
        Alert.alert('오류', result.message || '회원가입에 실패하였습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '서버와의 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.modalContainer}>
      <Title style={styles.signuppagetitle}>회원가입</Title>
      <TextInput
        value={signupInfo.signupUsername}
        onChangeText={text => setSignupInfo({ ...signupInfo, signupUsername: text })}
        style={styles.input}
        mode="outlined"
        placeholder="아이디를 입력하세요."
      />
      <TextInput
        value={signupInfo.signupPassword}
        secureTextEntry={!showPassword1}
        onChangeText={text => setSignupInfo({ ...signupInfo, signupPassword: text })}
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
        onChangeText={text => setConfirmPassword(text)}
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
        value={signupInfo.signupname} 
        onChangeText={text => setSignupInfo({ ...signupInfo, signupname: text })}
        style={styles.input}
        mode="outlined"
        placeholder="이름을 입력하세요."
      />
      
      <View style={styles.emailContainer}>
      <TextInput
  value={signupemail}
  onChangeText={handleEmailInput} // 한글 필터링 로직 추가
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
          setValue={(callback) => {
            const domain = callback(); // 콜백을 통해 도메인 값 가져오기
            setEmailDomain(domain); 
            updateEmail(signupemail, domain); // 도메인 변경 시 fullEmail 업데이트
          }}
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
