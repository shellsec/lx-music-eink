import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import Section from '../components/Section'
import SubTitle from '../components/SubTitle'
import Button from '../components/Button'

import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { FORK_RELEASES_URL } from '@/core/version'
import { openUrl } from '@/utils/tools'

const currentVer = process.versions.app
export default memo(() => {
  const t = useI18n()
  // 墨水屏 fork：不查官方更新，设置里打开本仓库 Releases
  const handleOpenForkReleases = () => {
    void openUrl(FORK_RELEASES_URL)
  }

  return (
    <Section title={t('setting_version')}>
      <SubTitle title={t('version_tip_latest')}>
        <View style={styles.desc}>
          <Text size={14}>{t('version_label_current_ver')}{currentVer}</Text>
        </View>
        <View style={styles.btn}>
          <Button onPress={handleOpenForkReleases}>{t('setting_version_show_ver_modal')}</Button>
        </View>
      </SubTitle>
    </Section>
  )
})

const styles = StyleSheet.create({
  desc: {
    marginBottom: 8,
  },
  btn: {
    flexDirection: 'row',
  },
})
