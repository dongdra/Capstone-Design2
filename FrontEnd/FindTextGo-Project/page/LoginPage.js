// LoginPage.js
import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { TextInput, Card, Title, Paragraph } from "react-native-paper";
import { API_BASE_URL } from '@env';
import axios from 'axios';
import SignupModal from '../signup/SignupModal';
import { addLog } from '../logService';
import { DataContext } from '../DataContext'; // DataContext import

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
		paddingVertical: 15,
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
	const [isSignupVisible, setSignupVisible] = useState(false);
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const { saveCredentials, saveUserInfo } = useContext(DataContext);

	useEffect(() => {
		if (storedCredentials?.identifier && storedCredentials?.password) {
			setIdentifier(storedCredentials.identifier);
			setPassword(storedCredentials.password);
		}
	}, [storedCredentials]);

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
			const response = await axios.post(`${API_BASE_URL}/user/login.php`, loginData, {
				headers: { 'Content-Type': 'application/json' },
			});
			if (response.data.StatusCode === 200) {
				const { name, email } = response.data.data;
				Alert.alert("로그인 성공", "홈 화면으로 이동합니다.");
				await addLog(`로그인 성공을 하였습니다.`);

				await saveCredentials(identifier, password);
				await saveUserInfo(name, email); // name과 email은 별도로 저장
				onLogin(identifier, password);
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
					<TouchableOpacity
						onPress={handleLogin}
						style={styles.loginbutton}
					>
						<Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>로그인</Text>
					</TouchableOpacity>

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