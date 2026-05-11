import { Feather } from '@expo/vector-icons';
import { Modal, Platform, Text, TextInput, View } from 'react-native';
import type { FileItem } from '@yourcloud/sdk';
import { ScalePressable } from '../../ui/ScalePressable';
import { filesStyles as styles } from './filesStyles';

type QuickActionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpload: () => void;
  onCreateFolder: () => void;
};

export function QuickActionsModal({ visible, onClose, onUpload, onCreateFolder }: QuickActionsModalProps) {
  return (
    <Modal transparent visible={visible && Platform.OS !== 'ios'} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <ScalePressable style={styles.modalMask} onPress={onClose} />
        <View style={styles.nativeSheet}>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              onClose();
              onUpload();
            }}
          >
            <Feather name="upload-cloud" size={18} color="#1E2C45" />
            <Text style={styles.sheetActionText}>上传文件</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              onClose();
              onCreateFolder();
            }}
          >
            <Feather name="folder-plus" size={18} color="#1E2C45" />
            <Text style={styles.sheetActionText}>新建文件夹</Text>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

type CreateFolderModalProps = {
  visible: boolean;
  folderName: string;
  creatingFolder: boolean;
  onClose: () => void;
  onChangeFolderName: (value: string) => void;
  onCreateFolder: () => void;
};

export function CreateFolderModal({ visible, folderName, creatingFolder, onClose, onChangeFolderName, onCreateFolder }: CreateFolderModalProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <ScalePressable style={styles.modalMask} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <Text style={styles.bottomSheetTitle}>新建文件夹</Text>
          <TextInput value={folderName} onChangeText={onChangeFolderName} style={styles.input} placeholder="输入文件夹名称" autoCapitalize="none" />
          <View style={styles.bottomSheetButtons}>
            <ScalePressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>取消</Text>
            </ScalePressable>
            <ScalePressable style={[styles.btn, styles.btnPrimary, creatingFolder && styles.btnDisabled]} onPress={onCreateFolder} disabled={creatingFolder}>
              <Text style={styles.btnPrimaryText}>{creatingFolder ? '创建中...' : '创建'}</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FileActionPaletteProps = {
  visible: boolean;
  selectedFile: FileItem | null;
  downloadingFileId: number | null;
  onClose: () => void;
  onDownload: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
};

export function FileActionPalette({
  visible,
  selectedFile,
  downloadingFileId,
  onClose,
  onDownload,
  onShare,
  onDelete,
}: FileActionPaletteProps) {
  return (
    <Modal transparent visible={visible && Platform.OS !== 'ios'} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <ScalePressable style={styles.modalMask} onPress={onClose} />
        <View style={styles.nativeSheet}>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              if (!selectedFile) return;
              onDownload(selectedFile);
              onClose();
            }}
            disabled={selectedFile ? downloadingFileId === selectedFile.id : false}
          >
            <Feather name="download" size={18} color="#2A67F7" />
            <Text style={styles.sheetActionText}>{selectedFile && downloadingFileId === selectedFile.id ? '下载中...' : '下载'}</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              if (!selectedFile) return;
              onShare(selectedFile);
              onClose();
            }}
          >
            <Feather name="share-2" size={18} color="#2A67F7" />
            <Text style={styles.sheetActionText}>分享</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              if (!selectedFile) return;
              onDelete(selectedFile);
              onClose();
            }}
          >
            <Feather name="trash-2" size={18} color="#E11D48" />
            <Text style={styles.sheetActionDangerText}>删除</Text>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

type ShareDialogModalProps = {
  visible: boolean;
  shareTarget: FileItem | null;
  shareExpireHours: string;
  shareExtractCode: string;
  creatingShare: boolean;
  onClose: () => void;
  onChangeExpireHours: (value: string) => void;
  onChangeExtractCode: (value: string) => void;
  onCreateShare: () => void;
};

export function ShareDialogModal({
  visible,
  shareTarget,
  shareExpireHours,
  shareExtractCode,
  creatingShare,
  onClose,
  onChangeExpireHours,
  onChangeExtractCode,
  onCreateShare,
}: ShareDialogModalProps) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <ScalePressable style={styles.modalMask} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <Text style={styles.bottomSheetTitle}>创建分享</Text>
          {shareTarget ? (
            <Text style={styles.shareTarget} numberOfLines={1}>
              文件：{shareTarget.filename}
            </Text>
          ) : null}
          <Text style={styles.shareLabel}>有效期（小时）</Text>
          <TextInput value={shareExpireHours} onChangeText={onChangeExpireHours} style={styles.input} keyboardType="number-pad" placeholder="默认 72" />
          <Text style={styles.shareLabel}>提取码（可选）</Text>
          <TextInput value={shareExtractCode} onChangeText={onChangeExtractCode} style={styles.input} placeholder="例如 abcd" autoCapitalize="none" />
          <View style={styles.bottomSheetButtons}>
            <ScalePressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={creatingShare}>
              <Text style={styles.btnGhostText}>取消</Text>
            </ScalePressable>
            <ScalePressable style={[styles.btn, styles.btnPrimary, creatingShare && styles.btnDisabled]} onPress={onCreateShare} disabled={creatingShare}>
              <Text style={styles.btnPrimaryText}>{creatingShare ? '创建中...' : '创建分享'}</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
