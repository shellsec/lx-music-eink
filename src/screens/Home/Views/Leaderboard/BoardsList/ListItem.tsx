import { useCallback, useRef } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import Button, { type BtnType } from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import { type BoardItem } from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'

export interface ListItemProps {
  item: BoardItem
  index: number
  longPressIndex: number
  activeId: string
  onShowMenu: (id: string, name: string, index: number, position: { x: number, y: number, w: number, h: number }) => void
  onBoundChange: (item: BoardItem) => void
  onPlay: (item: BoardItem) => void
}

export default ({ item, activeId, index, longPressIndex, onBoundChange, onShowMenu, onPlay }: ListItemProps) => {
  const theme = useTheme()
  const buttonRef = useRef<BtnType>(null)

  const setPosition = useCallback(() => {
    if (buttonRef.current?.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item.id, item.name, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [index, item, onShowMenu])

  const active = activeId == item.id

  return (
    <View style={{ ...styles.row, backgroundColor: index == longPressIndex ? theme['c-button-background-active'] : undefined }}>
      <Button
        ref={buttonRef}
        style={styles.button}
        key={item.id}
        onLongPress={setPosition}
        onPress={() => { onBoundChange(item) }}
      >
        {
          active
            ? <Icon style={styles.listActiveIcon} name="chevron-right" size={12} color={theme['c-primary-font']} />
            : null
        }
        <Text style={styles.listName} size={14} textBreakStrategy="simple" color={active ? theme['c-primary-font-active'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
      </Button>
      {/* 榜单旁的播放按钮：从该榜第一首开始连续播放 */}
      <TouchableOpacity style={styles.playBtn} onPress={() => { onPlay(item) }}>
        <Icon name="play" size={16} color={theme['c-button-font']} />
      </TouchableOpacity>
    </View>
  )
}

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 4,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listActiveIcon: {
    marginLeft: 3,
    textAlign: 'center',
  },
  listName: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 6,
  },
})
