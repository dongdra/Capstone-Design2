// Signup1.js
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, TextInput, Title } from 'react-native-paper';
import Checkbox from 'expo-checkbox';

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
    height: 150,
    marginBottom: 15,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#536ed9',
    paddingVertical: 10,
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
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [allAgreed, setAllAgreed] = useState(false);

  const handleAllAgree = (value) => {
    setAgreed1(value);
    setAgreed2(value);
    setAgreed3(value);
    setAllAgreed(value);
  };

  const handleIndividualAgree = (index) => {
    const newValues = [agreed1, agreed2, agreed3];
    newValues[index] = !newValues[index];
    setAgreed1(newValues[0]);
    setAgreed2(newValues[1]);
    setAgreed3(newValues[2]);
    setAllAgreed(newValues.every((v) => v === true));
  };

  const termsText = `
    [약관 내용]
    이 앱은 사용자 개인정보를 보호하며, 그에 따른 정책에 따릅니다.
    회원가입 시 사용자의 개인정보를 받습니다.
    약관에 동의하지 않으면 서비스를 이용할 수 없습니다.
  `;

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

      {/* 스크롤 가능한 약관 및 체크박스 영역 */}
      <ScrollView style={styles.checkboxScroll}>
        <TextInput
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={6}
          value={termsText}
          editable={false} // 수정 불가
          scrollEnabled={true} // 스크롤 가능
        />
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreed1}
            onValueChange={() => handleIndividualAgree(0)}
            color={agreed1 ? 'blue' : undefined}
          />
          <TouchableOpacity onPress={() => handleIndividualAgree(0)}>
            <Title style={styles.checkboxLabel}>첫 번째 약관에 동의합니다.</Title>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={6}
          value={termsText}
          editable={false} // 수정 불가
          scrollEnabled={true} // 스크롤 가능
        />
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreed2}
            onValueChange={() => handleIndividualAgree(1)}
            color={agreed2 ? 'blue' : undefined}
          />
          <TouchableOpacity onPress={() => handleIndividualAgree(1)}>
            <Title style={styles.checkboxLabel}>두 번째 약관에 동의합니다.</Title>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={6}
          value={termsText}
          editable={false} // 수정 불가
          scrollEnabled={true} // 스크롤 가능
        />
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreed3}
            onValueChange={() => handleIndividualAgree(2)}
            color={agreed3 ? 'blue' : undefined}
          />
          <TouchableOpacity onPress={() => handleIndividualAgree(2)}>
            <Title style={styles.checkboxLabel}>세 번째 약관에 동의합니다.</Title>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          onPress={onNext}
          disabled={!allAgreed} // 모든 약관에 동의해야 버튼 활성화
          style={styles.button}
        >
          다음
        </Button>
      </ScrollView>
    </View>
  );
}
