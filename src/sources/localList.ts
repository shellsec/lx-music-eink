import { createList } from '@/core/list'
import listState from '@/store/list/state'

export const LOCAL_MUSIC_LIST_ID = 'userlist_local_music_builtin'
export const LOCAL_MUSIC_LIST_NAME = '本地音乐'

/**
 * 确保「本地音乐」列表存在，对应手表版本地入口。
 * 实际加歌仍走现有「添加本地歌曲」能力。
 */
export const ensureLocalMusicList = async() => {
  const exists = listState.userList.some(l => l.id === LOCAL_MUSIC_LIST_ID || l.name === LOCAL_MUSIC_LIST_NAME)
  if (exists) return
  await createList({
    name: LOCAL_MUSIC_LIST_NAME,
    id: LOCAL_MUSIC_LIST_ID,
    list: [],
  })
}
