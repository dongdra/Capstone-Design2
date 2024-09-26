// LoginPage.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Card, Title, Paragraph } from "react-native-paper"; 
import SignupModal from '../Modal/SignupModal'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#1e90ff",
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  link: {
    color: "#1e90ff",
    fontWeight: "bold",
  },
});

export default function LoginPage({ onLogin }) {
  const [isSignupVisible, setSignupVisible] = useState(false); // 모달 상태 관리
  const [identifier, setIdentifier] = useState(""); // 아이디 상태 관리
  const [password, setPassword] = useState(""); // 비밀번호 상태 관리
  const [showPassword, setShowPassword] = useState(false); // 비밀번호 보이기/숨기기 상태 관리

  const handleSignup = (signupInfo) => {
    console.log("회원가입 정보:", signupInfo);
    // 여기서 회원가입 처리 로직을 추가할 수 있습니다.
  };

  const handleLogin = async () => {
    // 입력값이 비어 있으면 경고 표시
    if (!identifier || !password) {
      Alert.alert("경고", "아이디와 비밀번호를 모두 입력해주세요.");
      return; // 서버 전송을 막음
    }

    try {
      const response = await fetch("/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier,
          password: password,
        }),
      });

      // 서버 응답을 JSON으로 변환
      const data = await response.json();

      // 콘솔에 응답 상태 및 메시지 출력
      console.log("응답 데이터:", data);

      // StatusCode가 200이 아닌 경우 실패 처리
      if (data.StatusCode !== 200) {
        const errorMessage = data.message || "로그인 정보가 올바르지 않습니다.";
        Alert.alert("로그인 실패", errorMessage);
      } else {
        // StatusCode가 200인 경우 로그인 성공 처리
        Alert.alert("로그인 성공", "홈 화면으로 이동합니다.");
        onLogin(); // 성공 시 홈 화면 이동 콜백 호출
      }
    } catch (error) {
      Alert.alert("오류", "로그인 중 오류가 발생했습니다.");
      console.error("로그인 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>로그인</Title>
          
          <TextInput
            mode="outlined"
            label="아이디"
            placeholder="아이디를 입력하세요"
            value={identifier}
            onChangeText={setIdentifier}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            secureTextEntry={!showPassword} // showPassword 상태에 따라 보이거나 숨기기
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"} // 아이콘 변경
                onPress={() => setShowPassword(!showPassword)} // 아이콘을 누를 때 showPassword 상태 변경
              />
            }
          />

          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            로그인
          </Button>

          <Paragraph style={styles.footerText}>
            계정이 없으신가요?{" "}
            <Text
              style={styles.link}
              onPress={() => setSignupVisible(true)} // 회원가입 모달 표시
            >
              회원가입
            </Text>
          </Paragraph>
        </Card.Content>
      </Card>

      {/* 회원가입 모달 */}
      <SignupModal
        visible={isSignupVisible}
        onDismiss={() => setSignupVisible(false)} // 모달 닫기
        onSignup={handleSignup} // 회원가입 처리
      />
    </View>
  );
}
