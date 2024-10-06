// LoginPage.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Card, Title, Paragraph } from "react-native-paper";
import { API_BASE_URL } from '@env'; // .env에서 API_BASE_URL 불러오기
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
	loginbutton: {
		marginTop: 16, 
		backgroundColor: '#536ed9',
		paddingVertical: 10,
		borderRadius: 10
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

export default function LoginPage({ onLogin, storedCredentials }) {
	const [isSignupVisible, setSignupVisible] = useState(false); // 회원가입 모달 상태 추가
	const [identifier, setIdentifier] = useState(storedCredentials?.identifier || ""); // 저장된 아이디 사용
	const [password, setPassword] = useState(storedCredentials?.password || ""); // 저장된 비밀번호 사용
	const [showPassword, setShowPassword] = useState(false);

	// 저장된 자격증명이 있으면 자동 로그인 시도
	useEffect(() => {
		if (storedCredentials) {			
			handleLogin();// 자격증명이 있으면 로그인 시도
		}
	}, [storedCredentials]);

	 // 로그인 버튼 클릭 시 호출되는 함수
	const handleLogin = async () => {
		if (!identifier || !password) {
			Alert.alert("경고", "아이디와 비밀번호를 모두 입력해주세요.");
			return;
		}

		const loginData = {
			identifier: identifier,
			password: password,
		};

		try {
			const response = await fetch(`${API_BASE_URL}/user/login.php`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(loginData),
			});

			const data = await response.json();

			if (data.StatusCode == 200) {
				Alert.alert("로그인 성공", "홈 화면으로 이동합니다.");
				onLogin(identifier, password); // 로그인 성공 시 아이디와 비밀번호 전달
			} else {
				Alert.alert("로그인 실패", "로그인에 실패했습니다. 다시 시도해 주세요.");
			}
		} catch (error) {
			console.error("로그인 중 오류 발생:", error);
			Alert.alert("오류", "로그인에 실패했습니다. 다시 시도해 주세요.");
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
						secureTextEntry={!showPassword}
						value={password}
						onChangeText={setPassword}
						style={styles.input}
						right={
							<TextInput.Icon
								icon={showPassword ? "eye-off" : "eye"}
								onPress={() => setShowPassword(!showPassword)}
							/>
						}
					/>

					<Button mode="contained" onPress={handleLogin} labelStyle={{ fontSize: 16 }} style={styles.loginbutton}>
						로그인
					</Button>

					<Paragraph style={styles.footerText}>
						계정이 없으신가요?{" "}
						<Text style={styles.link} onPress={() => setSignupVisible(true)}>
							회원가입
						</Text>
					</Paragraph>
				</Card.Content>
			</Card>
			<SignupModal visible={isSignupVisible} onDismiss={() => setSignupVisible(false)} />
		</View>
	);
}
