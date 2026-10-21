import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { state as userApiState } from '@/store/userApi'
import { saveSubscriptionAddress, refreshSubscription } from '@/core/sourceSubscription'
import { setApiSource } from '@/core/apiSource'
import { USER_API_AUTO_ID } from '@/core/userApiFailover'
import { toast } from '@/utils/tools'
import Button from '../../components/Button'

export default memo(() => {
  const savedAddress = useSettingValue('common.sourceSubscriptionUrl')
  const [address, setAddress] = useState(savedAddress)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setAddress(savedAddress) }, [savedAddress])

  const save = async(refresh: boolean) => {
    setBusy(true)
    try {
      await saveSubscriptionAddress(address)
      if (refresh) {
        const changed = await refreshSubscription()
        if (changed) {
          const selected = settingState.setting['common.apiSource']
          const available = userApiState.list.some(api => api.id === selected) || (selected === USER_API_AUTO_ID && userApiState.list.length > 0)
          setApiSource(available ? selected : '')
        }
        toast(changed ? '订阅源已更新' : '清单和脚本没有变化')
      } else toast(address.trim() ? '订阅地址已保存' : '订阅已关闭')
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : String(error), 'long')
    } finally { setBusy(false) }
  }

  return <View style={{ marginTop: 15, gap: 10 }}>
    <Text>源清单订阅地址</Text>
    <Input
      value={address}
      onChangeText={setAddress}
      placeholder="https://example.com/sources.json"
      autoCapitalize="none"
      autoCorrect={false}
      editable={!busy}
      accessibilityLabel="源清单订阅地址"
    />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      <Button disabled={busy} onPress={() => { void save(false) }}>保存订阅地址</Button>
      <Button disabled={busy || !address.trim()} onPress={() => { void save(true) }}>{busy ? '处理中…' : '从源清单地址更新'}</Button>
    </View>
    <Text size={12}>默认留空。启用多源自动切换后，已导入的源全部失败时检查订阅；仅在有更新时再重试一轮。同一首歌本次运行内最多检查一次，不同歌曲之间至少间隔 5 分钟。清空并保存可关闭订阅。</Text>
  </View>
})
