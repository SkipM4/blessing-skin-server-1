import Vue from 'vue'
import { showModal, toast } from '../../scripts/notify'
import alertUnresolvedPlugins from './alertUnresolvedPlugins'

export default Vue.extend({
  data: () => ({ plugins: [] }),
  methods: {
    async enablePlugin({
      name, dependencies: { all }, originalIndex,
    }: {
      name: string
      dependencies: { all: Record<string, string> }
      originalIndex: number
    }) {
      if (Object.keys(all).length === 0) {
        try {
          await showModal({
            text: this.$t('admin.noDependenciesNotice'),
            okButtonType: 'warning',
          })
        } catch {
          return
        }
      }

      const {
        code, message, data: { reason } = { reason: [] },
      } = await this.$http.post(
        '/admin/plugins/manage',
        { action: 'enable', name },
      ) as { code: number, message: string, data: { reason: string[] } }
      if (code === 0) {
        toast.success(message)
        this.$set(this.plugins[originalIndex], 'enabled', true)
      } else {
        alertUnresolvedPlugins(message, reason)
      }
    },
  },
})
