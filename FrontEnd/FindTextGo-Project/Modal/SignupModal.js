// SignupModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Signup1 from './Signup1';
import Signup2 from './Signup2';

const styles = StyleSheet.create({
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignSelf: 'center',
    position: 'absolute',
    marginTop: 100
  },
  closeButton: {
    position: 'absolute', 
    top: 10,              
    right: 10,            
  },
  closeButtonText: {
    fontSize: 22,
    color: '#333',
    marginRight: 6
  },
});

// SignupModal.js에서 onSignup을 받아서 처리하는 부분
export default function SignupModal({ visible, onDismiss, onSignup }) {
  const [step, setStep] = useState(1); // 단계 관리

  // 모달이 닫힐 때 상태를 초기화
  useEffect(() => {
    if (!visible) {
      setStep(1); // 첫 번째 단계로 초기화
    }
  }, [visible]);

  const handleNextStep = () => setStep(2); // 2단계로 이동
  const handlePreviousStep = () => setStep(1); // 이전 단계로 돌아가기

  const handleSignupSuccess = () => {
    if (onSignup) {
      onSignup(); // 회원가입 완료 후 추가 처리
    }
    onDismiss(); // 모달 닫기
  };

  return (
    <Modal
      visible={visible}
      animationType="slide" // 모달 애니메이션을 슬라이드로 설정
      transparent={true}
      onRequestClose={onDismiss} // Android의 뒤로 가기 버튼 대응
    >
      <View style={styles.modalContent}>
        {/* 닫기 버튼 */}
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>

        {/* 단계별 컴포넌트 표시 */}
        {step === 1 ? (
          <Signup1 onNext={handleNextStep} />
        ) : (
          <Signup2 onSignup={handleSignupSuccess} onPrevious={handlePreviousStep} />
        )}
      </View>
    </Modal>
  );
}

