import { createList, setTempList, addListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/leaderboard'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import settingState from '@/store/setting/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'


const getListId = (id: string) => `board__${id}`

/** 写入「最近播放」（默认列表），方便手表版「最近」入口有内容 */
const rememberRecent = (list: LX.Music.MusicInfoOnline[]) => {
  if (!list.length) return
  void addListMusics(LIST_IDS.DEFAULT, list.slice(0, 50), settingState.setting['list.addMusicLocationType']).catch(() => {})
}

export const handlePlay = async(id: string, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  let isPlayingList = false
  // console.log(list)
  const listId = getListId(id)
  if (!list?.length) list = (await getListDetail(id, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    rememberRecent(list)
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(id)
  if (!fullList.length) return
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    rememberRecent(fullList)
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(id: string, name: string, source: LX.OnlineSource) => {
  const listId = getListId(id)
  const targetList = listState.userList.find(l => l.sourceListId == listId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(id)
  await createList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: listId,
  })
  toast(global.i18n.t('collect_success'))
}
