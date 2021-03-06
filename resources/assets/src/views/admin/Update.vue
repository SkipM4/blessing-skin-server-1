<template>
  <span>
    <button
      v-if="!updating"
      class="btn btn-primary"
      :disabled="!canUpdate"
      @click="update"
    >
      {{ $t('admin.updateButton') }}
    </button>
    <button v-else disabled class="btn btn-primary">
      <i class="fa fa-spinner fa-spin" /> {{ $t('admin.downloading') }}
    </button>

    <div
      id="modal-download"
      class="modal fade"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 v-t="'admin.downloading'" class="modal-title" />
          </div>
          <div class="modal-body">
            <div class="progress">
              <div
                class="progress-bar progress-bar-striped bg-primary"
                role="progressbar"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
                :style="{ width: `${percentage}%` }"
              >
                <span>{{ percentage }}</span>%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </span>
</template>

<script>
import emitMounted from '../../components/mixins/emitMounted'
import { showModal } from '../../scripts/notify'

const POLLING_INTERVAL = 500

export default {
  name: 'UpdateButton',
  mixins: [
    emitMounted,
  ],
  data: () => ({
    canUpdate: blessing.extra.canUpdate,
    updating: false,
    percentage: 0,
  }),
  methods: {
    async update() {
      this.updating = true
      $('#modal-download').modal({
        backdrop: 'static',
        keyboard: false,
      })

      setTimeout(() => this.polling(), POLLING_INTERVAL)
      const { code, message } = await this.$http.post(
        '/admin/update/download',
        { action: 'download' },
      )
      this.updating = false
      if (code) {
        showModal({
          mode: 'alert',
          text: message,
          type: 'danger',
          okButtonType: 'outline-light',
        })
        return
      }
      await showModal({
        mode: 'alert',
        text: this.$t('admin.updateCompleted'),
        okButtonType: 'success',
      })
      window.location = blessing.base_url
    },
    async polling() {
      const percentage = await this.$http.get(
        '/admin/update/download',
        { action: 'progress' },
      )
      this.percentage = ~~percentage * 100
      this.updating && setTimeout(this.polling, POLLING_INTERVAL)
    },
  },
}
</script>
