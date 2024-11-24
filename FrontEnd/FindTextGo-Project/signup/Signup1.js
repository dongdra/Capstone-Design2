import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Title } from 'react-native-paper';
import Checkbox from 'expo-checkbox';
import termsData from './terms.json'; // JSON 파일 import

const styles = StyleSheet.create({
  signuppagetitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 35,
    marginBottom: 20,
  },
  termContainer: {
    marginBottom: 20,
  },
  termScroll: {
    height: 200, // 고정된 높이로 스크롤 영역 설정
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  termContent: {
    flexGrow: 1,
    padding: 10,
  },
  termText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sigunupnextbutton: {
    width: '100%',
    backgroundColor: '#536ed9',
    paddingVertical: 15,
    borderRadius: 10,
  },
  checkboxLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  checkboxScroll: {
    maxHeight: 400,
    marginBottom: 20,
  },
});

export default function Signup1({ onNext }) {
  const [agreements, setAgreements] = useState(
    termsData.terms.map(() => false) // 약관 개수만큼 false로 초기화
  );

  const allAgreed = agreements.every(Boolean); // 모든 약관에 동의 상태 확인

  const handleAllAgree = (value) => {
    setAgreements(agreements.map(() => value)); // 모든 약관을 동일 상태로 변경
  };

  const handleIndividualAgree = (index) => {
    const newAgreements = [...agreements];
    newAgreements[index] = !newAgreements[index];
    setAgreements(newAgreements);
  };

  return (
    <View>
      <Title style={styles.signuppagetitle}>약관 동의</Title>

      {/* 전체 동의 체크박스 */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={allAgreed}
          onValueChange={handleAllAgree}
          color={allAgreed ? 'blue' : undefined}
        />
        <TouchableOpacity onPress={() => handleAllAgree(!allAgreed)}>
          <Title style={styles.checkboxLabel}>전체 동의</Title>
        </TouchableOpacity>
      </View>

      {/* 동적 약관 렌더링 */}
      <ScrollView style={styles.checkboxScroll} nestedScrollEnabled={true}>
        {termsData.terms.map((term, index) => (
          <View key={term.id} style={styles.termContainer}>
            <ScrollView
              style={styles.termScroll}
              contentContainerStyle={styles.termContent} 
              nestedScrollEnabled={true} 
            >
              <Text style={styles.termText}>{term.content}</Text>
            </ScrollView>
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={agreements[index]}
                onValueChange={() => handleIndividualAgree(index)}
                color={agreements[index] ? 'blue' : undefined}
              />
              <TouchableOpacity onPress={() => handleIndividualAgree(index)}>
                <Title style={styles.checkboxLabel}>
                  {term.id}번째 약관에 동의합니다.
                </Title>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          mode="contained"
          onPress={onNext}
          disabled={!allAgreed} 
          style={styles.sigunupnextbutton}
        >
          <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
