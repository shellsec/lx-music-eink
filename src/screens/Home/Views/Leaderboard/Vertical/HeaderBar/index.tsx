import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { createStyle } from '@/utils/tools'
import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import { useTheme } from '@/store/theme/hook'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { BorderWidths } from '@/theme'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  onPlayAll: () => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, onPlayAll }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const theme = useTheme()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])


  return (
    <View style={{ ...styles.currentList, borderBottomColor: theme['c-border-background'] }}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      <TouchableOpacity style={styles.playAllBtn} onPress={onPlayAll}>
        <Text size={13} color={theme['c-button-font']}>{t('play_all')}</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  currentList: {
    flexDirection: 'row',
    height: 38,
    zIndex: 2,
    borderBottomWidth: BorderWidths.normal,
    alignItems: 'center',
  },
  playAllBtn: {
    paddingLeft: 10,
    paddingRight: 12,
    height: '100%',
    justifyContent: 'center',
  },
})
