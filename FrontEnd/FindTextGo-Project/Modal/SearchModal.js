// SearchModal.js
import React from 'react';
import { Modal, Button, Text, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});

const SearchModal = ({ visible, hideModal }) => {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContent}>
        <Text>검색 모달입니다.</Text>
        <Button onPress={hideModal}>닫기</Button>
      </Modal>
    </Portal>
  );
};

export default SearchModal;
